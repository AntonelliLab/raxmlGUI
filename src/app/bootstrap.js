import { ipcRenderer } from 'electron';
import * as ipc from '../constants/ipc';
import store from './store';
import path from 'path';

console.log('\n========= Bootstrapping initial state... =========\n');

ipcRenderer.send(ipc.ALIGNMENT_EXAMPLE_FILES_GET_REQUEST);

ipcRenderer.on(ipc.ALIGNMENT_EXAMPLE_FILES_GET_SUCCESS, (event, exampleFiles) => {
  initDev(exampleFiles);
});

function initDev(exampleFiles) {
  // if (exampleFiles.length === 0) {
  //   return;
  // }
  // const exampleFilesDir = path.dirname(exampleFiles[0].path);
  const exampleFilesDir = exampleFiles.dir;
  // const useFiles = exampleFiles.filter(file => exampleFilenames.includes(file.name));
  const useFiles = [
    // 'dna.txt',
    // 'aminoacid.txt',
    // 'binary.txt',
    'bin1.txt',
    'bin2.txt',
    // 'align.txt',
    // 'mixed_data.txt',
    // 'multistate.txt',
    // 'nucleotide.txt',
  ].map(filename => ({ path: path.join(exampleFilesDir, 'fasta', filename) }));
  store.activeRun.addAlignments(useFiles);
  // store.activeRun.alignments[0].setShowPartition();
}
