import { observable, computed, action, toJS } from 'mobx';
import ipcRenderer from '../ipcRenderer';
import * as ipc from '../../constants/ipc';
import { range } from 'd3-array';
import cpus from 'cpus';
import Alignment from './Alignment';
import { settings } from '../../settings/analysis';
import parsePath from 'parse-filepath';

export const MAX_NUM_CPUS = cpus().length;

// Available parameters for different analysis
const params = { brL: 'brL', SHlike: 'SHlike', combinedOutput: 'combinedOutput', reps: 'reps', runs: 'runs', tree: 'tree', startingTree: 'startingTree', outGroup: 'outGroup' };

const analysisOptions = [
  {
    title: 'Fast tree search',
    value: 'FT',
    params: [params.brL, params.SHlike, params.outGroup],
  },
  {
    title: 'ML search',
    value: 'ML',
    params: [params.SHlike, params.combinedOutput, params.outGroup],
  },
  {
    title: 'ML + rapid bootstrap',
    value: 'ML+BS',
    params: [params.reps, params.brL, params.outGroup],
  }, // default
  {
    title: 'ML + thorough bootstrap',
    value: 'ML+tBS',
    params: [params.runs, params.reps, params.brL, params.outGroup],
  },
  {
    title: 'Bootstrap + consensus',
    value: 'BS+con',
    params: [params.reps, params.brL, params.outGroup],
  },
  {
    title: 'Ancestral states',
    value: 'AS',
    needTree: true,
    params: [params.tree],
  },
  {
    title: 'Pairwise distances',
    value: 'PD',
    params: [params.startingTree],
  },
  {
    title: 'RELL bootstraps',
    value: 'RBS',
    params: [params.reps, params.brL, params.outGroup],
  }
];

class Option {
  constructor(run, defaultValue, title, description) {
    this.run = run;
    this.defaultValue = defaultValue;
    this.title = title;
    this.description = description;
  }
  @observable value = this.defaultValue;
  @action setValue = (value) => { this.value = value; }
  @action reset() { this.value = this.defaultValue; }
}

class NumThreads extends Option {
  constructor(run) { super(run, 2, 'Threads', 'Number of cpu threads'); }
  options = range(2, MAX_NUM_CPUS + 1).map(value => ({ value, title: value }));
}

class Analysis extends Option {
  constructor(run) { super(run, 'ML+BS', 'Analysis', 'Type of analysis'); }
  options = settings.analysesOptions.map(({ value, title }) => ({ value, title }));
}

class NumRuns extends Option {
  constructor(run) { super(run, 1, 'Runs', 'Number of runs'); }
  options = [1, 10, 20, 50, 100, 500].map(value => ({ value, title: value }));
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.runs); }
}

class NumRepetitions extends Option {
  constructor(run) { super(run, 100, 'Reps.', 'Number of repetitions'); }
  options = [100, 200, 500, 1000, 10000, 'autoMR', 'autoMRE', 'autoMRE_IGN', 'autoFC'].map(value => ({ value, title: value }));
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.reps); }
}

//TODO: Another branch length option for FT? ('compute brL' vs 'BS brL' for the rest)
class BranchLength extends Option {
  constructor(run) { super(run, false, 'BS brL', 'Compute branch length'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.brL); }
}

class SHlike extends Option {
  constructor(run) { super(run, false, 'SH-like', 'Shimodaira-Hasegawa-like procedure'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.SHlike); }
}

class CombinedOutput extends Option {
  constructor(run) { super(run, false, 'combined output', 'Concatenate output trees'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.combinedOutput); }
}

class StartingTree extends Option {
  constructor(run) { super(run, 'Maximum parsimony', 'Starting tree', ''); }
  options = ['Maximum parsimony', 'User defined'].map(value => ({ value, title: value }));
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.startingTree); }
}

class OutGroup extends Option {
  constructor(run) { super(run, '<none>', 'Outgroup', ''); }
  @computed get options() { return ['<none>', ...this.run.taxons].map(value => ({ value, title: value })); }
  @computed get notAvailable() { return !this.run.haveAlignments || !this.run.analysisOption.params.includes(params.outGroup); }
}

class Tree extends Option {
  constructor(run) { super(run, '', 'Tree', ''); }
  @computed get notAvailable() {
    return !(this.run.analysisOption.params.includes(params.tree) ||
    (!this.run.startingTree.notAvailable && this.run.startingTree.value === 'User defined'));
  }
  @observable filePath = '';
  @computed get haveFile() { return !!this.filePath; }
  @computed get filename() { return parsePath(this.filePath).filename; }
  @computed get name() { return parsePath(this.filePath).name; }
  @computed get dir() { return parsePath(this.filePath).dir; }
  @action setFilePath = (filePath) => { this.filePath = filePath; }
  @action openFolder = () => {
    ipcRenderer.send(ipc.FOLDER_OPEN_IPC, this.filePath);
  };
  @action openFile = () => {
    ipcRenderer.send(ipc.FILE_OPEN_IPC, this.filePath);
  };
  @action remove = () => {
    this.setFilePath('');
  }
}


class Run {
  constructor(parent, id) {
    this.parent = parent;
    this.id = id;
    this.listen();
  }

  id = 0;

  numThreads = new NumThreads(this);
  analysis = new Analysis(this);

  @computed
  get analysisOption() {
    return analysisOptions.find(opt => opt.value === this.analysis.value);
  }

  // Analysis params
  numRuns = new NumRuns(this);
  numRepetitions = new NumRepetitions(this);
  branchLength = new BranchLength(this);
  sHlike = new SHlike(this);
  combinedOutput = new CombinedOutput(this);
  tree = new Tree(this);
  startingTree = new StartingTree(this);
  outGroup = new OutGroup(this);

  @observable outputName = '';
  @action setOutputName = (value) => {
    this.outputName = value;
  }

  @computed get haveAlignments() { return this.alignments.length > 0; }

  @computed get taxons() {
    return this.haveAlignments ? this.alignments[0].taxons : [];
  }

  // @computed
  // get needTree() {
  //   return this.analysisOption.params.includes(params.tree) ||
  //     (!this.startingTree.notAvailable && this.startingTree.value === 'User defined');
  // }
  // @observable treeFile = '';
  // @computed get haveTreeFile() { return !!this.treeFile; }
  // @action setTreeFile = (filePath) => { this.treeFile = filePath; }



  @observable repetitions = 100;//settings.numberRepsOptions.default;
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

  @computed
  get needAlignment() {
    return true;
  }


  @computed
  get startRunDisabled() {
    return !this.alignments.length > 0;
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
        if (this.alignments.length === 1) {
          this.setOutputName(this.alignments[0].name);
        }
      }
    });
  }

  @action
  removeAlignment = alignment => {
    const index = this.alignments.indexOf(alignment);
    if (index >= 0) {
      this.alignments.splice(index, 1);
    }
    if (!this.haveAlignments) {
      this.reset();
    }
  }

  @action
  reset = () => {
    this.outGroup.reset();
  }

  listen = () => {
    // Receive tree file path
    ipcRenderer.on(ipc.FILE_SELECTED_IPC, (event, filePath) => {
      const argsListTree = this.argsList.map(args =>
        Object.assign({}, args, this.globalArgs, { t: filePath })
      );
      this.setArgsList(argsListTree);
      this.tree.setFilePath(filePath);
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
