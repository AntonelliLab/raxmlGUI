const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const baselinePath = path.join(__dirname, 'typecheck-baseline.txt');

function diagnosticLines(text) {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

function fingerprint(line) {
  return line.replace(/\(\d+,\d+\): /, ': ');
}

/** Pathless tsc continuations belong to the preceding src/ header. */
function ownedFingerprints(lines) {
  let owner = '';
  return lines.map((line) => {
    const match = /^(src\/\S+?)\(/.exec(line);
    if (match) {
      owner = match[1];
      return fingerprint(line);
    }
    return owner
      ? `${owner}|${line}`
      : line;
  });
}

function freshLines(actual, known) {
  const seen = new Set(ownedFingerprints(known));
  const actualOwned = ownedFingerprints(actual);
  return actual.filter( (line, i) => !seen.has(actualOwned[i]) );
}

function unusedLines(known, actual) {
  const seen = new Set(ownedFingerprints(actual));
  const knownOwned = ownedFingerprints(known);
  return known.filter( (line, i) => !seen.has(knownOwned[i]) );
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
  const actual = diagnosticLines(`${result.stdout || ''}\n${result.stderr || ''}`);
  const fresh = freshLines(actual, baseline);
  const unused = unusedLines(baseline, actual);
  if (fresh.length || unused.length) {
    if (fresh.length) {
      console.error(fresh.join('\n'));
    }
    if (unused.length) {
      console.error('unused baseline:\n' + unused.join('\n'));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { diagnosticLines, freshLines, unusedLines, ownedFingerprints };
