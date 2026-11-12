const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const limit = 100;

function longImportLines(source) {
  const found = [];
  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('import ') && line.includes(' from ') && line.length > limit) {
      found.push(index + 1);
    }
  }
  return found;
}

function collect(rootDir) {
  const found = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.(js|jsx|ts|tsx)$/.test(name)) {
        const rel = path.relative(rootDir, full);
        for (const lineNumber of longImportLines(fs.readFileSync(full, 'utf8'))) {
          found.push(`${rel}:${lineNumber}`);
        }
      }
    }
  }
  walk(path.join(rootDir, 'src'));
  return found;
}

function main() {
  const found = collect(root);
  if (found.length) {
    console.error(found.join('\n'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { longImportLines };
