import { observable, computed, action, toJS } from 'mobx';
import ipcRenderer from '../ipcRenderer';
import * as ipc from '../../constants/ipc';
import { range } from 'd3-array';
import cpus from 'cpus';
import Alignment from './Alignment';

export const MAX_NUM_CPUS = cpus().length;

class Run {
  constructor(parent, id) {
    this.parent = parent;
    this.id = id;
    this.listen();
  }

  id = 0;

  @observable alignments = [];
  @observable analysisType = 'ML+BS';
  @observable argsList = [];
  @observable code = undefined;
  @observable createdAt = undefined;
  @observable data = '';
  @observable dataType = undefined;
  @observable flagsrunCode = undefined;
  @observable flagsrunData = undefined;
  @observable globalArgs = {};
  @observable inFile = undefined;
  @observable inFileFolder = undefined;
  @observable isPartitioned = false;
  @observable outFilename = '';
  @observable partitionFile = undefined;
  @observable partitions = undefined;
  @observable path = undefined;
  @observable sequences = [];
  @observable calculationComplete = false;
  @observable isCalculating = false;
  @observable combineOutput = false;
  @observable raxmlBinary = 'raxmlHPC-PTHREADS-SSE3-Mac';
  @observable stdout = '';

  @computed
  get numSites() {
    return this.alignments.reduce((sum, n) => sum + n, 0);
  }

  get startRunDisabled() {
    return false;
    // return !this.parent.alignments.alignments.length > 0;
  }

  get cpuOptions() {
    // TODO: Daniel why start at 2 here?
    return range(2, MAX_NUM_CPUS + 1);
  }

  @action
  proposeRun = () => {
    // Send alignments to main process
    console.log('proposeRun', this.alignments);
    ipcRenderer.send(ipc.RUN_PROPOSED_IPC, toJS(this.alignments));
  };

  @action
  startRun = () => {
    // Send runs to main process
    ipcRenderer.send(ipc.RUN_START_IPC, toJS(this));
  };

  @action
  cancelRun = () => {
    this.isCalculating = false;
    // Send runs to main process
    ipcRenderer.send(ipc.CALCULATION_CANCEL_IPC, toJS(this));
  };

  // TODO: this is the previous version of doing it, just replace the entire run object
  // must be better way here, only change the relevant params
  @action
  updateRun = run => {
    console.log('updateRun:', run);
    if (run.id === this.id || !run.id) {
      for (var key in run) {
        if (run.hasOwnProperty(key)) {
          this[key] = run[key];
        }
      }
    }
  };

  @action
  setGlobalArgs = value => {
    console.log('setGlobalArgs:', value);
    this.globalArgs = value;
  };

  @action
  setArgsList = value => {
    console.log('setArgsList:', value);
    this.argsList = value;
  };

  @action
  setAnalysisType = value => {
    console.log('setAnalysisType:', value);
    this.analysisType = value;
  };

  @action
  setCombineOutput = value => {
    console.log('setCombineOutput:', value);
    this.combineOutput = value;
  };

  // Open system dialog to choose file
  @action
  loadTreeFile = () => {
    ipcRenderer.send(ipc.FILE_SELECT_IPC, toJS(this));
  };

  @action
  setOutFilename = name => {
    this.outFilename = name;
  };

  @action
  selectWorkingDirectory = () => {
    ipcRenderer.send(ipc.FOLDER_SELECT_IPC, toJS(this));
  };

  @action
  removeRun = () => {
    this.cancelRun();
    this.parent.deleteRun(this);
  };

  // TODO: this maybe needed in a different store class as well, i.e. alignment ?
  @action
  showInFolder = outputPath => {
    ipcRenderer.send(ipc.FOLDER_OPEN_IPC, outputPath);
  };

  @action
  loadAlignmentFiles = () => {
    ipcRenderer.send(ipc.ALIGNMENT_SELECT_IPC);
  };

  haveAlignment = (id) => {
    return this.alignments.findIndex(alignment => alignment.id === id) >= 0;
  }

  @action
  addAlignments = alignments => {
    alignments.forEach(({ path }) => {
      if (!this.haveAlignment(path)) {
        this.alignments.push(new Alignment(this, path));
      }
    });
  }

  @action
  removeAlignment = alignment => {
    const index = this.alignments.indexOf(alignment);
    if (index >= 0) {
      this.alignments.splice(index, 1);
    }
  }

  listen = () => {
    // Receive tree file path
    ipcRenderer.on(ipc.FILE_SELECTED_IPC, (event, path) => {
      const argsListTree = this.argsList.map(args =>
        Object.assign({}, args, this.globalArgs, { t: path })
      );
      this.setArgsList(argsListTree);
    });

    // Listen to alignments being added
    ipcRenderer.on(ipc.ALIGNMENT_SELECTED_IPC, (event, data) => {
      this.addAlignments(data);
    });

    // Receive updated run with selected working directory
    ipcRenderer.on(ipc.FOLDER_SELECTED_IPC, (event, updatedRun) => {
      // TODO: change to be only the relevant param
      this.updateRun(updatedRun);
    });

    // TODO: listen to calculation progress
    // TODO: do this differently, i.e. does not need to entirely override the run object here only partially

    // Receive collated run data and files
    ipcRenderer.on(ipc.RUN_CREATED_IPC, (event, createdRuns) => {
      this.updateRun(createdRuns[0]);
    });

    // Receive a progress update for one of the runs being calculated
    ipcRenderer.on(ipc.FLAGSRUN_PROGRESS_IPC, (event, { run, XXXProgressUnit }) => {
      console.log(run, XXXProgressUnit);
      this.updateRun(run);
    });

    // Receive update that one run has completed flagsrun
    ipcRenderer.on(ipc.FLAGSRUN_END_IPC, (event, { run }) => {
      this.updateRun(run);
    });

    // Receive update that the flagsrun of one run has failed
    ipcRenderer.on(ipc.FLAGSRUN_ERROR_IPC, (event, { run, error }) => {
      console.log(run, error);
      this.updateRun(run);
    });

    // Receive a call that one run has started being calculated
    ipcRenderer.on(ipc.CALCULATION_START_IPC, (event, { run }) => {
      console.log('CLient received calculation start for: ', run);
      this.updateRun(run);
    });

    // Receive a progress update for one of the runs being calculated
    ipcRenderer.on(
      ipc.CALCULATION_PROGRESS_IPC,
      (event, { run, XXXProgressUnit }) => {
        console.log(run, XXXProgressUnit);
        this.updateRun(run);
        this.onStdout(event, run);
      }
    );

    // Receive update that one run has completed calculation
    ipcRenderer.on(ipc.CALCULATION_END_IPC, (event, { run }) => {
      this.updateRun(run);
      this.onStdout(event, run);
    });

    // Receive update that the calculation of one run has failed
    ipcRenderer.on(ipc.CALCULATION_ERROR_IPC, (event, { run, error }) => {
      console.log(run, error);
      this.updateRun(run);
      this.onStdout(event, run);
    });

    // Receive update that one run has been canceled
    ipcRenderer.on(ipc.CALCULATION_CANCELED_IPC, (event, { run }) => {
      this.updateRun(run);
      this.onStdout(event, run);
    });
  };

  @action
  clearStdout = () => {
    console.log('clearStdout');
    this.stdout = '';
  };

  @action
  onStdout = (event, run) => {
    console.log('onStdout');
    const { id, data } = run;
    console.log(
      'Raxml output:',
      data,
      'this.id:',
      this.id,
      'is this?',
      id === this.id
    );
    if (id === this.id) {
      this.stdout += data;
    }
  };
}

export default Run;
