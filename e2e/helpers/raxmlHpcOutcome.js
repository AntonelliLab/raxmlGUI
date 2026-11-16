/**
 * Reduce a raxmlHPC run to what a fixture keeps: the tool version, the model
 * passed with -m, the final score and the best tree. Paths and timings are
 * left out.
 * @param {{ info: string, bestTree: string }} files contents of
 *   RAxML_info.<name> and RAxML_bestTree.<name>
 * @returns {{ binaryVersions: Record<string, string>, model: string,
 *   score: number, bestTree: string }}
 */
function parseRaxmlHpcOutput({ info, bestTree }) {
  const version = /^This is RAxML version (\S+)/m.exec(info);
  if (!version) throw new Error('raxmlHPC info: no version line');
  // The command line follows the heading after one empty line
  const model = /^RAxML was called as follows:\s+.* -m (\S+)/m.exec(info);
  if (!model) throw new Error('raxmlHPC info: no -m in the command line');
  const score = /^Final GAMMA-based Score of best tree (\S+)/m.exec(info);
  if (!score) throw new Error('raxmlHPC info: no "Final GAMMA-based Score" line');
  return {
    binaryVersions: { raxmlHPC: version[1] },
    model: model[1],
    score: Number(score[1]),
    bestTree: bestTree.trim(),
  };
}

module.exports = { parseRaxmlHpcOutput };
