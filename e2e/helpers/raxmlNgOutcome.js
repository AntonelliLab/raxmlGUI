/**
 * Reduce a raxml-ng run to what a fixture keeps: the tool version, the model
 * of the first partition, the final log-likelihood and the best tree. Paths,
 * timings, thread counts and the collapsed tree are left out.
 * @param {{ log: string, bestTree: string }} files contents of
 *   <name>.raxml.log.txt and <name>.raxml.bestTree.tre
 * @returns {{ binaryVersions: Record<string, string>, model: string,
 *   logLikelihood: number, bestTree: string }}
 */
function parseRaxmlNgOutput({ log, bestTree }) {
  const version = /^RAxML-NG v\. (\S+)/m.exec(log);
  if (!version) throw new Error('raxml-ng log: no version line');
  const model = /^Model: (\S+)/m.exec(log);
  if (!model) throw new Error('raxml-ng log: no "Model:" line');
  const lnl = /^Final LogLikelihood: (\S+)/m.exec(log);
  if (!lnl) throw new Error('raxml-ng log: no "Final LogLikelihood" line');
  return {
    binaryVersions: { 'raxml-ng': version[1] },
    model: model[1],
    logLikelihood: Number(lnl[1]),
    bestTree: bestTree.trim(),
  };
}

module.exports = { parseRaxmlNgOutput };
