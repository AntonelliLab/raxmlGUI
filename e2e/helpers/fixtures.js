const fs = require('fs');
const path = require('path');
const { parseNewick, edges, compareTopologies } = require('./newick');

const RTOL = 1e-4;
const TREE_RTOL = 1e-3;
const REGENERATE = 'yarn test:e2e:update-fixtures';

/** @param {unknown} value */
const show = (value) =>
  typeof value === 'string' ? value : JSON.stringify(value);

/** @param {Record<string, any>} obj @param {string} [prefix] */
function flatten(obj, prefix = '') {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      Object.assign(out, flatten(value, name));
    } else {
      out[name] = value;
    }
  }
  return out;
}

/**
 * Differences between two Newick trees: topology exact (RF distance 0), then
 * each branch length within TREE_RTOL relative to the larger length.
 * @param {string} expected
 * @param {string} actual
 * @returns {{ field: string, expected: unknown, actual: unknown, delta: unknown, tolerance: string }[]}
 */
function compareTrees(expected, actual) {
  const topology = compareTopologies(expected, actual);
  if ('taxaMismatch' in topology) {
    const { onlyInA, onlyInB } = topology.taxaMismatch;
    return [
      {
        field: 'bestTree taxa',
        expected: `unique to fixture: ${onlyInA.join(' ') || 'none'}`,
        actual: `unique to actual: ${onlyInB.join(' ') || 'none'}`,
        delta: 'n/a',
        tolerance: 'exact',
      },
    ];
  }
  if (topology.rf) {
    return [
      {
        field: 'bestTree topology',
        expected: 'RF distance 0',
        actual: `RF distance ${topology.rf}\n  splits unique to fixture: ${topology.uniqueA.join(' | ') || 'none'}\n  splits unique to actual:  ${topology.uniqueB.join(' | ') || 'none'}`,
        delta: topology.rf,
        tolerance: 'exact',
      },
    ];
  }
  const ea = edges(parseNewick(expected));
  const eb = edges(parseNewick(actual));
  /** @type {ReturnType<typeof compareTrees>} */
  const diffs = [];
  for (const [key, x] of ea) {
    const y = eb.get(key);
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    const delta = Number((y - x).toPrecision(6));
    if (Math.abs(delta) > TREE_RTOL * Math.max(Math.abs(x), Math.abs(y))) {
      diffs.push({
        field: `bestTree branch ${key}`,
        expected: x,
        actual: y,
        delta,
        tolerance: `${TREE_RTOL} relative`,
      });
    }
  }
  return diffs;
}

/**
 * Differing fields, binary versions first. Numbers agree within RTOL
 * relative to the larger magnitude; everything else must be equal. A
 * `bestTree` field is compared as a tree.
 * @param {Record<string, any>} expected
 * @param {Record<string, any>} actual
 */
function compareOutcome(expected, actual) {
  const { bestTree: expectedTree, ...expectedRest } = expected;
  const { bestTree: actualTree, ...actualRest } = actual;
  const e = flatten(expectedRest);
  const a = flatten(actualRest);
  /** @type {{ field: string, expected: unknown, actual: unknown, delta: unknown, tolerance: string }[]} */
  const diffs = [];
  if (expectedTree !== undefined || actualTree !== undefined) {
    if (typeof expectedTree === 'string' && typeof actualTree === 'string') {
      diffs.push(...compareTrees(expectedTree, actualTree));
    } else {
      diffs.push({
        field: 'bestTree',
        expected: expectedTree,
        actual: actualTree,
        delta: 'n/a',
        tolerance: 'exact',
      });
    }
  }
  for (const field of new Set([...Object.keys(e), ...Object.keys(a)])) {
    const x = e[field];
    const y = a[field];
    if (typeof x === 'number' && typeof y === 'number') {
      const delta = Number((y - x).toPrecision(6));
      if (Math.abs(delta) > RTOL * Math.max(Math.abs(x), Math.abs(y))) {
        diffs.push({
          field,
          expected: x,
          actual: y,
          delta,
          tolerance: `${RTOL} relative`,
        });
      }
    } else if (x !== y) {
      diffs.push({
        field,
        expected: x,
        actual: y,
        delta: 'n/a',
        tolerance: 'exact',
      });
    }
  }
  const isVersion = (/** @type {{ field: string }} */ d) =>
    d.field.startsWith('binaryVersions');
  return [...diffs.filter(isVersion), ...diffs.filter((d) => !isVersion(d))];
}

/**
 * @param {ReturnType<typeof compareOutcome>} diffs
 * @param {string} fixturePath
 */
function formatReport(diffs, fixturePath) {
  const blocks = diffs.map(
    (d) =>
      `${d.field}\n  expected:  ${show(d.expected)}\n  actual:    ${show(d.actual)}\n  delta:     ${show(d.delta)}\n  tolerance: ${d.tolerance}`,
  );
  return `${blocks.join('\n\n')}\n\nFixture: ${fixturePath}\nRegenerate: ${REGENERATE}`;
}

/**
 * The one entry point per run. Compares the outcome with this host's fixture,
 * or writes the fixture when RAXMLGUI_UPDATE_FIXTURES is set.
 * @param {string} name fixture file name without extension
 * @param {Record<string, any> & { binaryVersions: Record<string, string> }} settings what the spec ran with
 * @param {Record<string, any> & { binaryVersions: Record<string, string> }} actual parsed outcome
 * @returns {{ ok: boolean, message: string }}
 */
function checkFixture(name, settings, actual) {
  const host = `${process.platform}-${process.arch}`;
  const fixturePath = path.join(__dirname, '..', 'fixtures', host, `${name}.json`);
  const { binaryVersions, ...outcome } = actual;

  if (process.env.RAXMLGUI_UPDATE_FIXTURES === '1') {
    // A fixture must not record a binary the spec does not declare
    const diffs = compareOutcome(
      { binaryVersions: settings.binaryVersions },
      { binaryVersions },
    );
    if (diffs.length) return { ok: false, message: formatReport(diffs, fixturePath) };
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(
      fixturePath,
      `${JSON.stringify({ settings, outcome }, null, 2)}\n`,
    );
    return { ok: true, message: `Wrote ${fixturePath}` };
  }

  if (!fs.existsSync(fixturePath)) {
    return {
      ok: false,
      message: `No fixture for ${host}: ${fixturePath}\nRegenerate: ${REGENERATE}`,
    };
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const drift = Object.keys({ ...fixture.settings, ...settings }).filter(
    (key) =>
      JSON.stringify(fixture.settings[key]) !== JSON.stringify(settings[key]),
  );
  if (drift.length) {
    return {
      ok: false,
      message: `Settings differ from the fixture: ${drift.join(', ')}\nFixture: ${fixturePath}\nRegenerate: ${REGENERATE}`,
    };
  }
  const diffs = compareOutcome(
    { binaryVersions: fixture.settings.binaryVersions, ...fixture.outcome },
    actual,
  );
  return diffs.length
    ? { ok: false, message: formatReport(diffs, fixturePath) }
    : { ok: true, message: '' };
}

module.exports = { checkFixture, compareOutcome, formatReport };
