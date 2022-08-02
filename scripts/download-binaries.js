const fs = require('fs').promises;
const path = require('path');
const download = require('download');

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
  'https://github.com/AntonelliLab/raxmlGUI-binaries/releases/download/v22.08.02';
const binariesUrl = `${binariesBaseDir}/${osName}.zip`;

const binPath = path.join(__dirname, '..', 'static', 'bin');
const raxmlNgPath = path.join(binPath, 'raxml-ng');

(async () => {
  console.log('Check binaries...');
  let exist = true;
  try {
    await fs.access(raxmlNgPath);
  } catch (_) {
    exist = false;
  }

  if (exist) {
    console.log('Binaries exist!');
    return;
  }

  console.log(`Binaries missing, downloading from '${binariesUrl}'...`);

  await download(binariesUrl, binPath, {
    extract: true,
  });
  console.log('Done!');
})();
