// Lists every @computed and @action in the page store and reports which run
// under jest. Exits 1 when any member is not run. Also lists @observable
// fields whose name appears in no test file (a pointer, not proof).
const { spawnSync } = require( 'child_process' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const parser = require( '@babel/parser' );

const root = path.join( __dirname, '..' );
const storeDir = path.join( root, 'src/app/store' );
const files = fs.readdirSync( storeDir ).filter( f => f.endsWith( '.js' ) && !f.endsWith( '.test.js' ) );
const tests = fs.readdirSync( storeDir ).filter( f => f.endsWith( '.test.js' ) )
  .map( f => fs.readFileSync( path.join( storeDir, f ), 'utf8' ) ).join( '\n' );

const covDir = fs.mkdtempSync( path.join( os.tmpdir(), 'page-store-cov-' ) );
const jest = spawnSync( 'node', [
  'node_modules/jest/bin/jest.js', '--watchAll=false', '--coverage', '--coverageReporters=json',
  `--coverageDirectory=${covDir}`, '--collectCoverageFrom=src/app/store/*.js',
  '--collectCoverageFrom=!src/app/store/*.test.js',
], { cwd: root, encoding: 'utf8' } );
if ( jest.status !== 0 ) {
  console.error( jest.stdout, jest.stderr );
  process.exit( 1 );
}
const coverage = JSON.parse( fs.readFileSync( path.join( covDir, 'coverage-final.json' ), 'utf8' ) );

const decoratorName = d => {
  let e = d.expression;
  if ( e.type === 'CallExpression' ) e = e.callee;
  while ( e.type === 'MemberExpression' ) e = e.object;
  return e.name;
};

const notRun = [];
const noObservableTest = [];
let computeds = 0;
let actions = 0;
let observables = 0;
for ( const file of files ) {
  const full = path.join( storeDir, file );
  const ast = parser.parse( fs.readFileSync( full, 'utf8' ), {
    sourceType: 'module', plugins: [ 'jsx', 'typescript', [ 'decorators', { decoratorsBeforeExport: true } ], 'classProperties' ],
  } );
  const cov = Object.entries( coverage ).find( ( [ p ] ) => p === full )?.[ 1 ];
  const walk = node => {
    if ( !node || typeof node.type !== 'string' ) return;
    if ( node.type === 'ClassDeclaration' || node.type === 'ClassExpression' ) {
      for ( const m of node.body.body ) {
        const kind = ( m.decorators || [] ).map( decoratorName )
          .find( n => [ 'computed', 'action', 'observable' ].includes( n ) );
        if ( !kind ) continue;
        const name = `${node.id?.name}.${m.key.name}`;
        if ( kind === 'observable' ) {
          observables += 1;
          if ( !new RegExp( `\\b${m.key.name}\\b` ).test( tests ) ) noObservableTest.push( `${file} ${name}` );
          continue;
        }
        if ( kind === 'computed' ) computeds += 1; else actions += 1;
        // The member's own function is the earliest one inside its range.
        const fns = cov ? Object.entries( cov.fnMap )
          .filter( ( [ , f ] ) => f.loc.start.line >= m.loc.start.line && f.loc.end.line <= m.loc.end.line )
          .sort( ( [ , a ], [ , b ] ) => a.loc.start.line - b.loc.start.line || a.loc.start.column - b.loc.start.column ) : [];
        if ( !fns.length || !cov.f[fns[0][0]] ) notRun.push( `${file}:${m.loc.start.line} ${kind} ${name}` );
      }
    }
    for ( const v of Object.values( node ) ) {
      if ( Array.isArray( v ) ) v.forEach( walk ); else if ( v && typeof v === 'object' ) walk( v );
    }
  };
  walk( ast.program );
}

console.log( `computeds: ${computeds}, actions: ${actions}, observables: ${observables}` );
console.log( `members not run: ${notRun.length}` );
notRun.forEach( l => console.log( `  ${l}` ) );
console.log( `observables named in no test: ${noObservableTest.length}` );
noObservableTest.forEach( l => console.log( `  ${l}` ) );
process.exit( notRun.length ? 1 : 0 );
