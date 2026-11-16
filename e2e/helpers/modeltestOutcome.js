/**
 * Reduce a ModelTest-NG results file to what a fixture keeps: the tool
 * version and, per criterion, the selected model and its score. Paths, thread
 * counts, tree files and the per-model tables are left out.
 * @param {string} text contents of RAxML_GUI_ModelTest_<name>.out
 * @returns {{ binaryVersions: Record<string, string>,
 *   criteria: Record<string, { model: string, score: number }> }}
 */
function parseModelTestLog(text) {
  const version = /^ModelTest-NG v(\S+)/m.exec(text);
  if (!version) throw new Error('ModelTest log: no version line');
  /** @type {Record<string, { model: string, score: number }>} */
  const criteria = {};
  const blocks =
    /^Best model according to (\S+)\n-+\nModel:\s+(\S+)\n(?:.*\n)*?Score:\s+(\S+)/gm;
  for (const [, criterion, model, score] of text.matchAll(blocks)) {
    criteria[criterion] = { model, score: Number(score) };
  }
  if (!Object.keys(criteria).length) {
    throw new Error('ModelTest log: no "Best model according to" block');
  }
  return { binaryVersions: { 'modeltest-ng': version[1] }, criteria };
}

module.exports = { parseModelTestLog };
