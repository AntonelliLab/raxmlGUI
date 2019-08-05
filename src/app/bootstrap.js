import ipcRenderer from './ipcRenderer';
import * as ipc from '../constants/ipc';
import store from './store';
import path from 'path';

console.log('\n========= Bootstrapping initial state... =========\n');

ipcRenderer.send(ipc.ALIGNMENT_EXAMPLE_FILES_GET_IPC);

ipcRenderer.on(ipc.ALIGNMENT_EXAMPLE_FILES_GOT_IPC, (event, exampleFiles) => {
  initDev(exampleFiles);
});

function initDev(exampleFiles) {
  if (exampleFiles.length === 0) {
    return;
  }
  const exampleFilesDir = path.dirname(exampleFiles[0].path);
  // const useFiles = exampleFiles.filter(file => exampleFilenames.includes(file.name));
  const useFiles = [
    // 'aminoacid.txt',
    'binary.txt',
    // 'mixed_data.txt',
    // 'multistate.txt',
    // 'nucleotide.txt',
  ].map(filename => ({ path: path.join(exampleFilesDir, filename) }));
  store.activeRun.addAlignments(useFiles);
  // store.activeRun.alignments[0].setShowPartition();
}
