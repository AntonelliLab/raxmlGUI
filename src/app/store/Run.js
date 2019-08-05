import { observable, computed, action, createAtom } from 'mobx';
import ipcRenderer from '../ipcRenderer';
import * as ipc from '../../constants/ipc';
import { range } from 'd3-array';
import cpus from 'cpus';
import Alignment, { FinalAlignment } from './Alignment';
import parsePath from 'parse-filepath';
import { promisedComputed } from 'computed-async-mobx';
import { join } from 'path';
import filenamify from 'filenamify';

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
    value: 'ML+rBS',
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
  constructor(run, defaultValue, title, description, hoverInfo) {
    this.run = run;
    this.defaultValue = defaultValue;
    this.title = title;
    this.description = description;
    this.hoverInfo = hoverInfo;
  }
  @observable value = this.defaultValue;
  @action setValue = (value) => { this.value = value; }
  @action reset() { this.value = this.defaultValue; }
  @computed get isDefault() { return this.value === this.defaultValue; }
}

class NumThreads extends Option {
  constructor(run) { super(run, 2, 'Threads', 'Number of cpu threads'); }
  options = range(2, MAX_NUM_CPUS + 1).map(value => ({ value, title: value }));
}

class Analysis extends Option {
  constructor(run) { super(run, 'ML+rBS', 'Analysis', 'Type of analysis'); }
  options = analysisOptions.map(({ value, title }) => ({ value, title }));
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
  constructor(run) { super(run, false, 'BS brL', 'Compute branch length', 'Optimize model parameters and branch lengths for the given input tree'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.brL); }
}

class SHlike extends Option {
  constructor(run) { super(run, false, 'SH-like', 'Compute log-likelihood test', 'Shimodaira-Hasegawa-like procedure'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.SHlike); }
}

class CombinedOutput extends Option {
  constructor(run) { super(run, false, 'Combined output', 'Concatenate output trees'); }
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
    this.outputNamePlaceholder = `${id}`;
    this.atomNameAvailable = createAtom('nameAvailable');
  }

  id = 0;

  // Async query to electron backend
  sendAsync = (channel, payload, onChannel) => {
    return new Promise((resolve, reject) => {
      const { id } = this;
      const listener = (event, result) => {
        if (result.id === this.id) {
          ipcRenderer.removeListener(onChannel, listener);
          resolve(result);
        }
      }
      ipcRenderer.on(onChannel, listener);
      ipcRenderer.send(channel, Object.assign({ id }, payload));
    });
  }

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
  outGroup = new OutGroup(this);
  startingTree = new StartingTree(this);

  tree = new Tree(this);
  @action
  loadTreeFile = () => {
    ipcRenderer.send(ipc.TREE_SELECT, this.id);
  };


  @observable outputName = 'output';
  @action setOutputName = (value) => {
    this.outputName = filenamify(value.replace(' ', '_').trim());
  }

  atomNameAvailable; // Trigger atom when run is finished to re-run outputNameAvailable

  outputNameAvailable = promisedComputed(true, async () => {
    if (this.atomNameAvailable.reportObserved()) {
      console.log('\n!!!atom observed');
    }
    const { id, outputDir, outputName, outputNamePlaceholder } = this;
    const result = await this.sendAsync(ipc.OUTPUT_CHECK, {
      id, outputDir, outputName: outputName || outputNamePlaceholder
    }, ipc.OUTPUT_CHECKED);
    return result;
  });

  @computed get outputNameOk() {
    return this.outputNameAvailable.get().ok;
  }

  @computed get outputNameNotice() {
    return this.outputNameAvailable.get().notice;
  }

  @computed get outputNameSafe() {
    return this.outputNameAvailable.get().outputNameUnused || this.outputNamePlaceholder;
  }

  @computed get outputFilenameSafe() {
    return `${this.outputNameSafe}.tre`;
  }

  @observable outputDir = '';
  @action
  setOutputDir = dir => {
    this.outputDir = dir;
  };
  @action
  selectOutputDir = () => {
    ipcRenderer.send(ipc.OUTPUT_DIR_SELECT, this.id);
  };

  @action openOutputDir = () => {
    ipcRenderer.send(ipc.FOLDER_OPEN_IPC, this.outputDir);
  };

  @computed get haveAlignments() { return this.alignments.length > 0; }

  @computed get taxons() {
    return this.haveAlignments ? this.alignments[0].taxons : [];
  }

  finalAlignment = new FinalAlignment(this);

  @observable error = null;

  @computed get missing() {
    if (!this.tree.notAvailable && !this.tree.value) {
      return 'Missing tree, please load one.';
    }
    return '';
  }

  @observable running = false;

  @computed get ok() {
    return !this.error && !this.missing;
  }

  @computed get startDisabled() {
    return this.alignments.length === 0 || !this.ok || this.running;
  }

  @observable seed = Math.floor(Math.random() * 1000 + 1);
  @observable seedRapidBootstrap = Math.floor(Math.random() * 1000 + 1);

  @observable binaryName = 'raxmlHPC-PTHREADS-SSE3-Mac';

  @computed get args() {
    const first = [];
    const cmdArgs = [first];

    switch (this.analysis.value) {
      case 'FT':
        // cmd= """cd %s %s &&%s %s -f E -p %s %s -n %s -s %s -O -w %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, mod, out_file, seq_file, path_dir, part_f, cmd_temp1,cmd_temp2, winEx)
        first.push('-T', this.numThreads.value);
        first.push('-f', 'E');
        first.push('-p', this.seed);
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', this.finalAlignment.path);
        first.push('-w', `${this.outputDir}`);
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        if (this.branchLength.value) {
          const treeFile1 = join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const cmd = [];
          cmd.push('-T', this.numThreads.value);
          cmd.push('-f', 'e');
          cmd.push('-m', this.finalAlignment.modelFlagName);
          cmd.push('-t', `${treeFile1}`);
          cmd.push('-n', `brL.${this.outputFilenameSafe}`);
          cmd.push('-s', `${this.finalAlignment.path}`);
          cmd.push('-w', `${this.outputDir}`);
          if (this.alignments.length > 1) {
            cmd.push('-q', `${this.finalAlignment.partitionFilePath}`);
          }
          cmdArgs.push(cmd);
        }
        if (this.sHlike.value) {
          const treeFile2 = this.branchLength.value ?
          join(this.outputDir, `RAxML_result.brL.${this.outputFilenameSafe}`) :
          join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const cmd = [];
          cmd.push('-T', this.numThreads.value);
          cmd.push('-f', 'e');
          cmd.push('-m', this.finalAlignment.modelFlagName);
          cmd.push('-t', `${treeFile2}`);
          cmd.push('-n', `sh.${this.outputFilenameSafe}`);
          cmd.push('-s', `${this.finalAlignment.path}`);
          cmd.push('-w', `${this.outputDir}`);
          if (this.alignments.length > 1) {
            cmd.push('-q', `${this.finalAlignment.partitionFilePath}`);
          }
          cmdArgs.push(cmd);
        }
        break;
      case 'ML':
        break;
      case 'ML+rBS':
        // cmd= """cd %s %s&& %s %s %s -f a -x %s %s %s -p %s -N %s %s -s %s -n %s %s -O -w %s %s %s %s""" \
        // % (winD, raxml_path, runWin, K[0], pro, seed_1, save_brL.get(),mod, seed_2, BSrep.get(), o, seq_file, out_file, \
        // part_f, path_dir, const_f, result, winEx)
        first.push('-T', this.numThreads.value);
        first.push('-f', 'a');
        first.push('-x', this.seedRapidBootstrap);
        first.push('-p', this.seed);
        first.push('-N', this.numRepetitions.value);
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-n', `${this.outputFilenameSafe}`);
        first.push('-s', this.finalAlignment.path);
        first.push('-w', `${this.outputDir}`);
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        break;
      case 'ML+tBS':
        break;
      case 'BS+con':
        break;
      case 'AS':
        break;
      case 'PD':
        break;
      case 'RBS':
        break;
      default:
    }

    // if (!this.numRuns.notAvailable) {
    //   first.push('-N', this.numRuns.value);
    // }
    // else if (!this.numRepetitions.notAvailable) {
    //   first.push('-N', this.numRepetitions.value);
    // }

    // if (!this.branchLength.notAvailable && this.branchLength.value) {
    //   first.push('-f', 'e');
    //   extension = '.brL.tre';
    // }
    // else if (!this.sHlike.notAvailable && this.sHlike.value) {
    //   first.push('-f', 'J');
    //   extension = '.SH.tre';
    // }

    // if (!this.tree.notAvailable && this.tree.value) {
    //   first.push('-t', this.tree.value);
    // }
    // else if (!this.startingTree.notAvailable && this.startingTree.value) {
    //   first.push('-t', this.startingTree.value);
    // }

    // if (this.numThreads.value > 1) {
    //   first.push('-T', this.numThreads.value);
    // }

    // if (!this.outGroup.notAvailable && !this.outGroup.isDefault) {
    //   first.push('-o', this.outGroup.value);
    // }

    // first.push('-n', this.outputFilenameSafe);

    return cmdArgs;
  }

  @computed get command() {
    return this.args.map(cmdArgs => `${this.binaryName} ${cmdArgs.join(' ')}`).join(' &&\\\n');
  }

  @action
  start = () => {
    const { id, args, binaryName } = this;
    console.log(`Start run ${id} with args ${args}`);
    this.running = true;
    ipcRenderer.send(ipc.RUN_START, { id, args, binaryName });
  };

  @action
  cancel = () => {
    ipcRenderer.send(ipc.RUN_CANCEL, this.id);
    this.afterRun();
  }

  @action
  afterRun = () => {
    this.running = false;
    this.atomNameAvailable.reportChanged();
  }


  @observable repetitions = 100;//settings.numberRepsOptions.default;
  @observable alignments = [];
  @observable analysisType = 'ML+rBS';
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
  @observable partitionFile = undefined;
  @observable partitions = undefined;
  @observable path = undefined;
  @observable sequences = [];
  @observable calculationComplete = false;
  @observable isCalculating = false;
  @observable combineOutput = false;
  @observable stdout = '';
  @observable stderr = '';

  @computed
  get numSites() {
    return this.alignments.reduce((sum, n) => sum + n, 0);
  }

  @computed
  get needAlignment() {
    return true;
  }


  @action
  removeRun = () => {
    this.parent.deleteRun(this);
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
          this.setOutputDir(this.alignments[0].dir);
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
  clearStdout = () => {
    this.stdout = '';
  };

  @action
  clearError = () => {
    this.error = null;
  };

  @action
  reset = () => {
    this.outGroup.reset();
  }

  dispose = () => {
    this.cancel();
    this.unlisten();
  }

  listeners = []
  listenTo = (channel, listener) => {
    ipcRenderer.on(channel, listener);
    this.listeners.push([channel, listener]);
  }

  listen = () => {

    this.listenTo(ipc.TREE_SELECTED, this.onTreeSelected);

    this.listenTo(ipc.ALIGNMENT_SELECTED_IPC, this.onAlignmentAdded);

    this.listenTo(ipc.OUTPUT_DIR_SELECTED, this.onOutputDirSelected);

    this.listenTo(ipc.RUN_STDOUT, this.onRunStdout);
    this.listenTo(ipc.RUN_STDERR, this.onRunStderr);
    this.listenTo(ipc.RUN_STARTED, this.onRunStarted);
    this.listenTo(ipc.RUN_FINISHED, this.onRunFinished);
    this.listenTo(ipc.RUN_ERROR, this.onRunError);
  }

  unlisten = () => {
    while (!this.listeners.length > 0) {
      const [channel, listener] = this.listeners.pop();
      ipcRenderer.removeListener(channel, listener);
    }
  }

  // -----------------------------------------------------------
  // Listeners
  // -----------------------------------------------------------

  @action
  onTreeSelected = (event, { id, filePath }) => {
    if (id === this.id) {
      this.tree.setFilePath(filePath);
    }
  }

  @action
  onAlignmentAdded = (event, data) => {
    this.addAlignments(data);
  }

  @action
  onOutputDirSelected = (event, { id, outputDir }) => {
    this.setOutputDir(outputDir);
  }

  @action
  onRunStdout = (event, { id, content }) => {
    if (id === this.id) {
      this.stdout += content;
    }
  };

  @action
  onRunStderr = (event, { id, content }) => {
    if (id === this.id) {
      this.stderr += content;
    }
  };

  @action
  onRunStarted = (event, { id }) => {
    if (id === this.id) {
      console.log(`Process ${id} started...`);
      this.running = true;
      this.error = null;
    }
  };

  @action
  onRunFinished = (event, { id, code }) => {
    if (id === this.id) {
      console.log(`Process ${id} finished with code ${code}.`);
      this.afterRun();
    }
  };

  @action
  onRunError = (event, { id, error }) => {
    if (id === this.id) {
      console.log(`Process ${id} finished with error:`, error);
      this.error = error;
      this.afterRun();
    }
  };
}

export default Run;
