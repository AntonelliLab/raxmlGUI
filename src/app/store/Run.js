import { observable, computed, action, createAtom } from 'mobx';
import { ipcRenderer } from 'electron';
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
  @computed get cmdValue() { return this.value === '<none>' ? '' : this.value }
  //TODO: Allow multiple selections
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
    this.atomAfterRun = createAtom('AfterRun');
    this.atomFinished = createAtom('finished');
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

  @observable disableCheckUndeterminedSequence = true;

  @observable outputName = 'output';
  @action setOutputName = (value) => {
    this.outputName = filenamify(value.replace(' ', '_').trim());
  }

  atomAfterRun; // Trigger atom when run is finished to re-run outputNameAvailable

  outputNameAvailable = promisedComputed(true, async () => {
    const { id, outputDir, outputName, outputNamePlaceholder, atomAfterRun } = this;
    const outputNameToCheck = outputName || outputNamePlaceholder;
    const check = atomAfterRun.reportObserved() || outputNameToCheck;
    if (!check) {
      return;
    }
    const result = await this.sendAsync(ipc.OUTPUT_CHECK, {
      id, outputDir, outputName: outputNameToCheck
    }, ipc.OUTPUT_CHECKED);
    return result;
  });

  @computed get outputNameOk() {
    return this.outputNameAvailable.get().ok;
  }

  @computed get outputNameSafe() {
    return this.outputNameAvailable.get().outputNameUnused || this.outputNamePlaceholder;
  }

  @computed get outputNameNotice() {
    return this.outputNameOk ? '' : `New run will use output id '${this.outputNameSafe}'`;
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

  // Result
  @observable resultDir = ''
  @computed get resultFilenames() {
    return this.outputNameAvailable.get().resultFilenames || [];
  }

  @computed get haveResult() {
    return this.resultFilenames.length > 0 && this.resultDir === this.outputDir;
  }

  @action openFile = (filePath) => {
    ipcRenderer.send(ipc.FILE_OPEN, filePath);
  }

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
  @observable finished = false;
  @action clearFinished = () => {
    this.finished = false;
  }
  atomFinished;

  @computed get ok() {
    return !this.error && !this.missing;
  }

  @computed get startDisabled() {
    return this.alignments.length === 0 || !this.ok || this.running;
  }

  @observable seedParsimony = Math.floor(Math.random() * 1000 + 1);
  @observable seedRapidBootstrap = Math.floor(Math.random() * 1000 + 1);
  @observable seedBootstrap = Math.floor(Math.random() * 1000 + 1);

  @observable binaryName = 'raxmlHPC-PTHREADS-SSE3-Mac';

  @computed get args() {
    const first = [];
    const cmdArgs = [first];

    switch (this.analysis.value) {
      case 'FT': // Fast tree search
        // params: [params.brL, params.SHlike, params.outGroup],
        // cmd= """cd %s %s &&%s %s -f E -p %s %s -n %s -s %s -O -w %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, mod, out_file, seq_file, path_dir, part_f, cmd_temp1,cmd_temp2, winEx)
        //TODO: Where is outGroup? From line 1436 in original code, -o is unchecked
        first.push('-T', this.numThreads.value);
        first.push('-f', 'E');
        first.push('-p', this.seedParsimony);
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', this.finalAlignment.path);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-w', `${this.outputDir}`);
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        if (this.branchLength.value) {
          const treeFile1 = join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const next = [];
          next.push('-T', this.numThreads.value);
          next.push('-f', 'e');
          next.push('-m', this.finalAlignment.modelFlagName);
          next.push('-t', `${treeFile1}`);
          next.push('-n', `brL.${this.outputFilenameSafe}`);
          next.push('-s', `${this.finalAlignment.path}`);
          next.push('-w', `${this.outputDir}`);
          if (this.alignments.length > 1) {
            next.push('-q', `${this.finalAlignment.partitionFilePath}`);
          }
          cmdArgs.push(next);
        }
        if (this.sHlike.value) {
          const treeFile2 = this.branchLength.value ?
          join(this.outputDir, `RAxML_result.brL.${this.outputFilenameSafe}`) :
          join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const next = [];
          next.push('-T', this.numThreads.value);
          next.push('-f', 'e');
          next.push('-m', this.finalAlignment.modelFlagName);
          next.push('-t', `${treeFile2}`);
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', `${this.finalAlignment.path}`);
          next.push('-w', `${this.outputDir}`);
          if (this.alignments.length > 1) {
            next.push('-q', `${this.finalAlignment.partitionFilePath}`);
          }
          cmdArgs.push(next);
        }
        break;
      case 'ML': // ML search
        // params: [params.SHlike, params.combinedOutput, params.outGroup],
        // cmd= """cd %s %s&&%s %s -f d %s -N %s -O -p %s %s -s %s -n %s %s -w %s %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, mod, BSrep2.get(), random.randrange(1, 1000, 1), o, seq_file, out_file, part_f, path_dir, const_f, result2, cmd_temp2, combine_trees, winEx)
        //TODO: Check conf_f (from line 754 in original source)
        first.push('-T', this.numThreads.value);
        first.push('-f', 'd');
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-N', this.numRepetitions.value);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-p', this.seedParsimony);
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', this.finalAlignment.path);
        first.push('-w', `${this.outputDir}`);
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        if (this.sHlike.value) {
          const treeFile = join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const next = [];
          next.push('-T', this.numThreads.value);
          next.push('-f', 'e');
          next.push('-m', this.finalAlignment.modelFlagName);
          next.push('-t', `${treeFile}`);
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', `${this.finalAlignment.path}`);
          next.push('-w', `${this.outputDir}`);
          if (this.alignments.length > 1) {
            next.push('-q', `${this.finalAlignment.partitionFilePath}`);
          }
          cmdArgs.push(next);
        }
        if (this.combinedOutput.value) {
          // TODO: Add binary to the above commands to not assume raxml
          // TODO: Use 'type' instead of 'cat' for windows
          // const cmd = [];
          // cmd.push('cat', `RAxML_*.${this.outputFilenameSafe}`);
          // cmdArgs.push(cmd);
        }
        break;
      case 'ML+rBS': // ML + rapid bootstrap
        // params: [params.reps, params.brL, params.outGroup],
        // cmd= """cd %s %s&& %s %s %s -f a -x %s %s %s -p %s -N %s %s -s %s -n %s %s -O -w %s %s %s %s""" \
        // % (winD, raxml_path, runWin, K[0], pro, seed_1, save_brL.get(),mod, seed_2, BSrep.get(), o, seq_file, out_file, \
        // part_f, path_dir, const_f, result, winEx)
        first.push('-T', this.numThreads.value);
        first.push('-f', 'a');
        first.push('-x', this.seedRapidBootstrap);
        first.push('-p', this.seedParsimony);
        first.push('-N', this.numRepetitions.value);
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', this.finalAlignment.path);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-w', `${this.outputDir}`);
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        break;
      case 'ML+tBS': // ML + thorough bootstrap
        // params: [params.runs, params.reps, params.brL, params.outGroup],
        // cmd= """cd %s %s \
        // &&%s %s -b %s %s %s -p %s -N %s %s -s %s -n %s %s -w %s %s -O && cd %s \
        // &&%s %s -f d %s %s -s %s -N %s -n %s %s -w %s %s -p %s -O && cd %s \
        // &&%s %s -f b -t %s -z %s %s -s %s -n %s -w %s %s -O %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, mod, save_brL.get(),seed_2, BSrep.get(), o, seq_file, out_file1, part_f, path_dir, const_f,\
        // raxml_path, K[0], pro, mod, o, seq_file, BSrep2.get(), out_file2, part_f, path_dir, const_f,random.randrange(1, 1000, 1), \
        // raxml_path, K[0], pro, MLtreeR, trees, mod, seq_file, out_file, path_dir, result, winEx)
        // try:
        // 	remove="RAxML_info.%s.tre" % (only_name)
        // ...
        const second = [];
        const third = [];
        cmdArgs.push(second, third);
        const outputFilenameSafe1 = `${this.outputNameSafe}R.tre`;
        const outputFilenameSafe2 = `${this.outputNameSafe}B.tre`;
        const treeFile = join(this.outputDir, `RAxML_bestTree.${outputFilenameSafe2}`); // MLtreeR
        const treesFile = join(this.outputDir, `RAxML_bootstrap.${outputFilenameSafe1}`); // trees
        // first wrote RAxML_bootstrap.binary_8R.tre
        // second wrote RAxML_bootstrap.binary_8B.tre

        first.push('-T', this.numThreads.value);
        first.push('-b', this.seedBootstrap);
        first.push('-m', this.finalAlignment.modelFlagName);
        if (this.branchLength.value) {
          first.push('-k');
        }
        first.push('-p', this.seedParsimony);
        first.push('-N', this.numRepetitions.value);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-n', outputFilenameSafe1);
        first.push('-s', this.finalAlignment.path);
        first.push('-w', `${this.outputDir}`);
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }

        second.push('-T', this.numThreads.value);
        second.push('-f', 'd');
        second.push('-m', this.finalAlignment.modelFlagName);
        second.push('-p', this.seedParsimony);
        second.push('-N', this.numRuns.value);
        second.push('-n', outputFilenameSafe2);
        second.push('-s', this.finalAlignment.path);
        if (this.disableCheckUndeterminedSequence) {
          second.push('-O');
        }
        second.push('-w', `${this.outputDir}`);
        if (this.outGroup.cmdValue) {
          second.push('-o', this.outGroup.cmdValue);
        }
        if (this.alignments.length > 1) {
          second.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }

        third.push('-T', this.numThreads.value);
        third.push('-f', 'b');
        third.push('-t', treeFile);
        third.push('-z', treesFile);
        third.push('-m', this.finalAlignment.modelFlagName);
        third.push('-n', this.outputFilenameSafe);
        third.push('-s', this.finalAlignment.path);
        if (this.disableCheckUndeterminedSequence) {
          third.push('-O');
        }
        third.push('-w', `${this.outputDir}`);
        // if (this.alignments.length > 1) {
        //   third.push('-q', `${this.finalAlignment.partitionFilePath}`);
        // }

        break;
      case 'BS+con': // Bootstrap + consensus
        // params: [params.reps, params.brL, params.outGroup],
        // BStrees_file= """  "%sRAxML_bootstrap.%s"    """ % (path_dirsimple, out_file)
        // cmd= """cd %s %s \
        // && %s %s %s %s -n %s -s %s %s -x %s -N %s -w %s %s %s -p %s -O && cd %s\
        // && %s %s %s -n con.%s -J MR -z %s -w %s %s
        // """ \
        // % (winD, raxml_path, \
        // K[0], pro, mod, save_brL.get(), out_file, seq_file, o, seed_1, BSrep.get(), path_dir, part_f, const_f, random.randrange(1, 1000, 1), raxml_path, \
        // K[0], pro, mod, out_file, BStrees_file, path_dir, winEx)
        break;
      case 'AS': // Ancestral states
        // params: [params.tree],
        // cmd = """cd %s %s &&%s %s -f A -t "%s" -s %s %s -n %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, rooted_tree, seq_file, mod, out_file, path_dir, part_f, winEx)
        first.push('-T', this.numThreads.value);
        first.push('-f', 'A');
        first.push('-t', this.tree.filePath);
        first.push('-s', this.finalAlignment.path);
        first.push('-m', this.finalAlignment.modelFlagName);
        first.push('-n', `${this.outputFilenameSafe}`);
        first.push('-w', `${this.outputDir}`);
        if (this.alignments.length > 1) {
          first.push('-q', `${this.finalAlignment.partitionFilePath}`);
        }
        break;
      case 'PD': // Pairwise distances
        // params: [params.startingTree],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // cmd = """cd %s %s &&%s %s -f x -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
        break;
      case 'RBS': // Rell bootstraps
        // params: [params.reps, params.brL, params.outGroup],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // 	cmd = """cd %s %s &&%s %s -f D -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // 	% (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
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
    const { id, args, binaryName, outputDir, outputFilenameSafe: outputFilename } = this;
    console.log(`Start run ${id} with args ${args}`);
    this.running = true;
    if (this.outputName !== this.outputNameSafe) {
      this.outputName = this.outputNameSafe;
    }
    ipcRenderer.send(ipc.RUN_START, { id, args, binaryName, outputDir, outputFilename });
  };

  @action
  cancel = () => {
    ipcRenderer.send(ipc.RUN_CANCEL, this.id);
    this.afterRun();
  }

  @action
  afterRun = () => {
    this.running = false;
    this.atomAfterRun.reportChanged();
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
      this.finished = false;
      this.error = null;
    }
  };

  @action
  onRunFinished = (event, { id, resultDir, resultFilenames }) => {
    if (id === this.id) {
      console.log(`Process ${id} finished with result filenames ${resultFilenames} in dir ${resultDir}.`);
      this.resultDir = resultDir;
      this.atomFinished.reportChanged();
      this.finished = true;
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
