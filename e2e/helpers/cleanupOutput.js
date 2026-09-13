const fs = require('fs/promises');
const path = require('path');

/**
 * Remove output files created by an e2e run.
 * @param {string} outputDir
 * @param {string} outputId
 */
async function cleanupOutputFiles(outputDir, outputId) {
  let entries;
  try {
    entries = await fs.readdir(outputDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const prefixes = [
    outputId,
    `RAxML_GUI_Settings_${outputId}`,
    'RAxML_GUI_ModelTest_nucleotide',
  ];

  await Promise.all(
    entries
      .filter((entry) => prefixes.some((prefix) => entry.startsWith(prefix)))
      .map((entry) => fs.rm(path.join(outputDir, entry), { force: true }))
  );
}

module.exports = {
  cleanupOutputFiles,
};
