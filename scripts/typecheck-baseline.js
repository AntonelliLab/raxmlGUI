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

/**
 * Repoint baseline entries from one file path to another after a pure move.
 * An entry is rewritten only when tsc reports the same code and message at the
 * new path, so the rename can never shelter a new diagnostic.
 */
function renameLines(known, actual, from, to) {
  const unclaimed = actual.filter( (line) => line.startsWith(`${to}(`) );
  const missing = [];
  const renamed = known.map((line) => {
    if (!line.startsWith(`${from}(`)) {
      return line;
    }
    const want = fingerprint(`${to}${line.slice(from.length)}`);
    const i = unclaimed.findIndex( (candidate) => fingerprint(candidate) === want );
    if (i === -1) {
      missing.push(line);
      return line;
    }
    return unclaimed.splice(i, 1)[0];
  });
  return { renamed, missing };
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
  const renameAt = process.argv.indexOf('--rename');
  if (renameAt !== -1) {
    const [from, to] = process.argv.slice(renameAt + 1, renameAt + 3);
    if (!from || !to) {
      console.error('usage: typecheck-baseline.js --rename <old path> <new path>');
      process.exit(1);
    }
    if (!baseline.some( (line) => line.startsWith(`${from}(`) )) {
      console.error('no baseline entries at ' + from);
      process.exit(1);
    }
    const { renamed, missing } = renameLines(baseline, actual, from, to);
    if (missing.length) {
      console.error('no matching diagnostic at ' + to + ' for:\n' + missing.join('\n'));
      process.exit(1);
    }
    fs.writeFileSync(baselinePath, renamed.join('\n') + '\n');
    return;
  }
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

module.exports = { diagnosticLines, freshLines, unusedLines, ownedFingerprints, renameLines };
