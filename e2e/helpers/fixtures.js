const fs = require('fs');
const path = require('path');

const RTOL = 1e-4;
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
 * Differing fields, binary versions first. Numbers agree within RTOL
 * relative to the larger magnitude; everything else must be equal.
 * @param {Record<string, any>} expected
 * @param {Record<string, any>} actual
 */
function compareOutcome(expected, actual) {
  const e = flatten(expected);
  const a = flatten(actual);
  /** @type {{ field: string, expected: unknown, actual: unknown, delta: unknown, tolerance: string }[]} */
  const diffs = [];
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
