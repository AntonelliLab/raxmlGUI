import ipcRenderer from './ipcRenderer';
import * as ipc from '../constants/ipc';
import store from './store';

console.log('\n========= Bootstrapping initial state... =========\n');

ipcRenderer.send(ipc.ALIGNMENT_EXAMPLE_FILES_GET_IPC);

ipcRenderer.on(ipc.ALIGNMENT_EXAMPLE_FILES_GOT_IPC, (event, data) => {
  initDev(data);
});

function initDev(exampleFiles) {
  store.activeRun.addAlignments(exampleFiles.slice(0, 1));
  // store.activeRun.alignments[0].setShowPartition();
}
