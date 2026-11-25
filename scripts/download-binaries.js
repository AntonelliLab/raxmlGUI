const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const extract = require('extract-zip');

const osName = (() => {
  switch (process.platform) {
    case 'darwin':
      return 'Mac';
    case 'win32':
      return 'Windows';
    default:
      return 'Linux';
  }
})();

const binariesBaseDir =
  'https://github.com/AntonelliLab/raxmlGUI-binaries/releases/download/v24.09.28';
const binariesUrl = `${binariesBaseDir}/${osName}.zip`;

const binPath = path.join(__dirname, '..', 'static', 'bin');
const osBinPath = path.join(binPath, osName);

// The Mac zip carries Finder metadata the app never reads.
const removeMacMetadata = () =>
  fs.rm(path.join(binPath, '__MACOSX'), { recursive: true, force: true });

(async () => {
  console.log('Check binaries...');
  const osBinEntries = await fs.readdir(osBinPath).catch(() => []);
  if (osBinEntries.length > 0) {
    await removeMacMetadata();
    console.log('Binaries exist!');
    return;
  }

  console.log(`Binaries missing, downloading from '${binariesUrl}'...`);
  const response = await fetch(binariesUrl);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'raxmlgui-bin-'));
  try {
    const zipPath = path.join(tmpDir, `${osName}.zip`);
    await fs.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
    // extract-zip keeps the execute bits stored in the zip entries.
    await extract(zipPath, { dir: binPath });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
  await removeMacMetadata();
  console.log('Done!');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
