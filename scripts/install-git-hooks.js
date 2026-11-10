const fs = require('fs');
const path = require('path');

if (!fs.existsSync('.git')) {
  process.exit(0);
}

const destDir = path.join('.git', 'hooks');
fs.mkdirSync(destDir, { recursive: true });
const dest = path.join(destDir, 'pre-commit');
fs.copyFileSync(path.join('scripts', 'hooks', 'pre-commit'), dest);
fs.chmodSync(dest, 0o755);
