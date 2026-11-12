const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const baselinePath = path.join(__dirname, 'log-baseline.txt');
const callRe = /console\.(debug|log|warn|error)\b/;

function lineKey(file, line) {
  return `${file}: ${line.trim()}`;
}

function isCommented(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

function collect(rootDir) {
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.(js|jsx|ts|tsx)$/.test(name)) {
        files.push(full);
      }
    }
  }
  walk(path.join(rootDir, 'src'));
  const keys = [];
  for (const full of files.sort()) {
    const rel = path.relative(rootDir, full);
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      if (!callRe.test(line) || isCommented(line)) {
        continue;
      }
      keys.push(lineKey(rel, line));
    }
  }
  return keys;
}

function missingLines(actual, known) {
  const counts = new Map();
  for (const line of actual) {
    counts.set(line, (counts.get(line) || 0) + 1);
  }
  const missing = [];
  for (const line of known) {
    const left = counts.get(line) || 0;
    if (left === 0) {
      missing.push(line);
    } else {
      counts.set(line, left - 1);
    }
  }
  return missing;
}

function readBaseline(file) {
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

function main() {
  if (!fs.existsSync(baselinePath)) {
    console.error('log baseline is missing: ' + baselinePath);
    process.exit(1);
  }
  const known = readBaseline(baselinePath);
  if (known.length === 0) {
    console.error('log baseline is empty: ' + baselinePath);
    process.exit(1);
  }
  const missing = missingLines(collect(root), known);
  if (missing.length) {
    console.error(missing.join('\n'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collect, lineKey, missingLines };
