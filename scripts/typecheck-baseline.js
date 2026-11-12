const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const baselinePath = path.join(root, 'docs', 'agents', 'typecheck-baseline.txt');

function diagnosticLines(text) {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

function fingerprint(line) {
  return line.replace(/\(\d+,\d+\): /, ': ');
}

function freshLines(actual, known) {
  const seen = new Set(known.map(fingerprint));
  return actual.filter((line) => !seen.has(fingerprint(line)));
}

function main() {
  if (!fs.existsSync(baselinePath)) {
    console.error('typecheck baseline is missing: ' + baselinePath);
    process.exit(1);
  }
  const baseline = diagnosticLines(fs.readFileSync(baselinePath, 'utf8'));
  if (baseline.length === 0) {
    console.error('typecheck baseline is empty: ' + baselinePath);
    process.exit(1);
  }
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const result = spawnSync(process.execPath, [tsc, '--noEmit', '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.error || (result.status !== 0 && result.status !== 2)) {
    console.error(result.error || result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  const fresh = freshLines(
    diagnosticLines(`${result.stdout || ''}\n${result.stderr || ''}`),
    baseline,
  );
  if (fresh.length) {
    console.error(fresh.join('\n'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { diagnosticLines, freshLines };
