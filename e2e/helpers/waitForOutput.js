const fs = require('fs/promises');

/**
 * Wait until an output file exists on disk.
 * @param {string | string[]} filePaths
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<string>} path of the file that appeared
 */
async function waitForOutputFile(filePaths, { timeout = 10 * 60 * 1000 } = {}) {
  const candidates = Array.isArray(filePaths) ? filePaths : [filePaths];
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const filePath of candidates) {
      try {
        await fs.stat(filePath);
        return filePath;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Timed out waiting for output file: ${candidates.join(' or ')}`,
  );
}

module.exports = {
  waitForOutputFile,
};
