// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { spawnSync } = require( 'child_process' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );

const root = path.join( __dirname, '..' );
const configFile = path.join( root, 'electron.vite.config.js' );
const preloadFile = path.join( root, 'out', 'preload', 'index.js' );
const electronBin = path.join( root, 'node_modules', 'electron', 'cli.js' );

function loadPreloadConfig() {
  const script = [
    "import { loadConfigFromFile } from 'electron-vite';",
    `const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, ${JSON.stringify( configFile )}, ${JSON.stringify( root )});`,
    'const preload = loaded.config.preload;',
    'const plugins = (preload.plugins || []).flat().filter(Boolean).map((item) => item.name);',
    'console.log("PRELOAD_CONFIG " + JSON.stringify({',
    '  externalizeDeps: preload.build && preload.build.externalizeDeps,',
    '  plugins,',
    '}));',
  ].join( '\n' );
  const result = spawnSync( process.execPath, ['--input-type=module', '-e', script], {
    cwd: root,
    encoding: 'utf8',
  } );
  if ( result.status !== 0 ) {
    throw new Error( result.stderr || result.stdout );
  }
  const line = result.stdout.split( '\n' ).find( ( item ) => item.startsWith( 'PRELOAD_CONFIG ' ) );
  return JSON.parse( line.slice( 'PRELOAD_CONFIG '.length ) );
}

function buildShell() {
  const result = spawnSync(
    process.execPath,
    [path.join( root, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js' ), 'build'],
    { cwd: root, encoding: 'utf8', timeout: 180000 },
  );
  if ( result.status !== 0 ) {
    throw new Error( result.stderr || result.stdout );
  }
}

function loadProofs() {
  const dir = path.join( __dirname, 'preload-proofs' );
  return fs.readdirSync( dir )
    .filter( ( name ) => name.endsWith( '.json' ) )
    .sort()
    .map( ( name ) => JSON.parse( fs.readFileSync( path.join( dir, name ), 'utf8' ) ) );
}

beforeAll( () => {
  buildShell();
}, 180000 );

it( 'builds one CommonJS preload with dependencies inlined and electron external', () => {
  const config = loadPreloadConfig();
  expect( config.externalizeDeps ).toBe( false );
  expect( config.plugins ).not.toContain( 'vite:externalize-deps' );

  const scripts = fs.readdirSync( path.join( root, 'out', 'preload' ) ).filter( ( name ) => name.endsWith( '.js' ) || name.endsWith( '.mjs' ) );
  expect( scripts ).toEqual( ['index.js'] );
  const code = fs.readFileSync( preloadFile, 'utf8' );
  expect( code ).toContain( 'contextBridge' );
  expect( code ).toContain( 'exposeInMainWorld' );
  expect( code ).toMatch( /require\(["']electron["']\)/ );
  expect( code ).not.toMatch( /require\(["']electron-store["']\)/ );
  expect( code ).not.toMatch( /require\(["']electron-better-ipc["']\)/ );
  expect( code ).not.toMatch( /require\(["']@sentry\/electron\/renderer["']\)/ );
  expect( code ).not.toContain( 'ALIGNMENT_PARSE_REQUEST' );
} );

const canLaunchElectron = process.platform === 'darwin' || Boolean( process.env.DISPLAY );

const launchCopy = canLaunchElectron
  ? it
  : it.skip;

launchCopy( 'copyText resolves void and the clipboard receives the text', () => {
  const proofs = loadProofs();
  const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'raxml-preload-' ) );
  const mainFile = path.join( dir, 'main.js' );
  const pageFile = path.join( dir, 'page.html' );
  fs.writeFileSync( path.join( dir, 'genes.part' ), 'DNA, gene = 1-100\n' );
  fs.writeFileSync( pageFile, `<script type="module">
const result = {};
try {
  const copied = await rendererBridge.copyText('bridge-text');
  result.copied = copied === undefined;
  const proofs = ${JSON.stringify( proofs )};
  for (const proof of proofs) {
    result[proof.key] = await rendererBridge[proof.method](...proof.args);
  }
  const { ipcRenderer } = require('electron');
  ipcRenderer.send('ping', { n: 7 });
  result.sent = true;
  const fs = require('fs');
  const file = ${JSON.stringify( path.join( dir, 'note.txt' ) )};
  fs.writeFileSync(file, 'ok');
  result.file = fs.readFileSync(file, 'utf8');
  const Store = require('electron-store');
  const store = new Store({ name: 'preload-probe' });
  store.set('k', 'v');
  result.got = store.get('k');
  result.stem = require('parse-filepath')('/tmp/example.fasta').name;
  result.safe = require('filenamify')('a/b');
  result.model = require('os').cpus()[0].model;
  const seen = require('os');
  const host = rendererBridge.host;
  result.host = host;
  result.hostSame = host === rendererBridge.host;
  result.hostMatches = host.windows === (seen.platform() === 'win32')
    && host.release === seen.release()
    && host.arch === seen.arch()
    && host.cpuModel === seen.cpus()[0].model;
  await new Promise((resolve, reject) => {
    const stream = require('fs').createWriteStream(file + '.stream');
    const timer = setTimeout(() => reject(new Error('callback not called')), 2000);
    stream.end('x', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  result.ended = true;
  const readPath = ${JSON.stringify( path.join( dir, 'genes.part' ) )};
  const writePath = ${JSON.stringify( path.join( dir, 'concat.fasta' ) )};
  result.text = await rendererBridge.readFile(readPath);
  const written = await rendererBridge.writeFile(writePath, '>Homo\\nAT');
  result.written = written === undefined;
} catch (error) {
  result.error = String(error && error.stack || error);
}
globalThis.__result = result;
</script>` );
  fs.writeFileSync( mainFile, `const { app, BrowserWindow, clipboard, ipcMain } = require('electron');
const Store = require(${JSON.stringify( path.join( root, 'node_modules', 'electron-store' ) )});
app.whenReady().then(async () => {
  Store.initRenderer();
  ipcMain.handle('COPY_TEXT', async (_event, text) => {
    await clipboard.writeText(text);
  });
  const proofs = ${JSON.stringify( proofs )};
  for (const proof of proofs) {
    ipcMain.handle(proof.channel, async (_event, ...args) => {
      if (proof.log) console.log(proof.log + ' ' + args[0]);
      return proof.result;
    });
  }
  const fs = require('fs');
  ipcMain.handle('READ_FILE', async (_event, filePath) => {
    return fs.promises.readFile(filePath, 'utf8');
  });
  ipcMain.handle('WRITE_FILE', async (_event, filePath, text) => {
    await fs.promises.writeFile(filePath, text);
  });
  ipcMain.on('ping', (_event, data) => { console.log('PING ' + JSON.stringify(data)); });
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
      preload: ${JSON.stringify( preloadFile )},
    },
  });
  win.webContents.on('console-message', (event) => console.log('PAGE ' + event.message));
  await win.loadFile(${JSON.stringify( pageFile )});
  const result = await win.webContents.executeJavaScript(\`new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (globalThis.__result || Date.now() - start > 6000) {
        clearInterval(timer);
        resolve(globalThis.__result || { error: 'no result' });
      }
    }, 50);
  })\`);
  const clip = await clipboard.readText();
  console.log('RESULT ' + JSON.stringify({ result, clip }));
  app.exit(result && result.error ? 1 : 0);
});
setTimeout(() => app.exit(2), 8000);
` );
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync( process.execPath, [electronBin, mainFile], {
    cwd: root,
    encoding: 'utf8',
    timeout: 20000,
    env,
  } );
  const line = `${result.stdout}\n${result.stderr}`.split( '\n' ).find( ( item ) => item.startsWith( 'RESULT ' ) );
  if ( !line ) {
    throw new Error( result.stderr || result.stdout || `electron exited ${result.status}` );
  }
  const payload = JSON.parse( line.slice( 'RESULT '.length ) );
  expect( payload.result.error ).toBeUndefined();
  expect( payload.result.copied ).toBe( true );
  for ( const proof of proofs ) {
    expect( payload.result[proof.key] ).toEqual( proof.result );
    if ( proof.log ) {
      expect( `${result.stdout}` ).toContain( `${proof.log} ${proof.args[0]}` );
    }
  }
  expect( payload.clip ).toBe( 'bridge-text' );
  expect( payload.result.sent ).toBe( true );
  expect( payload.result.file ).toBe( 'ok' );
  expect( payload.result.got ).toBe( 'v' );
  expect( payload.result.stem ).toBe( 'example' );
  expect( payload.result.safe ).toBe( 'a!b' );
  expect( typeof payload.result.model ).toBe( 'string' );
  expect( payload.result.model.length ).toBeGreaterThan( 0 );
  expect( Object.keys( payload.result.host ).sort() ).toEqual( ['arch', 'cpuModel', 'release', 'windows'] );
  expect( payload.result.hostSame ).toBe( true );
  expect( payload.result.hostMatches ).toBe( true );
  expect( typeof payload.result.host.release ).toBe( 'string' );
  expect( payload.result.host.release.length ).toBeGreaterThan( 0 );
  expect( typeof payload.result.host.cpuModel ).toBe( 'string' );
  expect( payload.result.host.cpuModel.length ).toBeGreaterThan( 0 );
  expect( payload.result.ended ).toBe( true );
  expect( payload.result.text ).toBe( 'DNA, gene = 1-100\n' );
  expect( payload.result.written ).toBe( true );
  expect( fs.readFileSync( path.join( dir, 'concat.fasta' ), 'utf8' ) ).toBe( '>Homo\nAT' );
  expect( `${result.stdout}` ).toContain( '"n":7' );
}, 30000 );

