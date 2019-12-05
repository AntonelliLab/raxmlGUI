import { observable, computed, action, createAtom } from 'mobx';
import { ipcRenderer, shell } from 'electron';
import * as ipc from '../../constants/ipc';
import { range } from 'd3-array';
import cpus from 'cpus';
import Alignment, { FinalAlignment } from './Alignment';
import Option from './Option';
import parsePath from 'parse-filepath';
import { promisedComputed } from 'computed-async-mobx';
import { join } from 'path';
import filenamify from 'filenamify';
import util from 'electron-util';
import StoreBase from './StoreBase';
import * as raxmlSettings from '../../settings/raxml';
import * as raxmlNgSettings from '../../settings/raxmlng';
const raxmlModelOptions = raxmlSettings.modelOptions;
const raxmlNgModelOptions = raxmlNgSettings.modelOptions;

export const MAX_NUM_CPUS = cpus().length;

const winBinaries = [
  // TODO: add raxml ng windows exe
  { name: 'raxmlHPC.exe', multithreaded: false },
  // { name: 'raxmlHPC-SSE3.exe', multithreaded: false },
  { name: 'raxmlHPC-PTHREADS-AVX2.exe', multithreaded: true },
  { name: 'raxmlHPC-PTHREADS-SSE3.exe', multithreaded: true },
];

const binaries = util.is.windows ? winBinaries : [
  { name: 'raxml-ng', multithreaded: true },
  { name: 'raxmlHPC', multithreaded: false },
  { name: 'raxmlHPC-SSE3', multithreaded: false },
  { name: 'raxmlHPC-PTHREADS-AVX', multithreaded: true },
  { name: 'raxmlHPC-PTHREADS-SSE3', multithreaded: true },
];

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
    params: [params.runs, params.SHlike, params.combinedOutput, params.outGroup],
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
    params: [],
  }
];

const raxmlNgAnalysisOptions = [
  {
    title: 'Sanity check',
    value: 'SC',
    params: [],
  },
  {
    title: 'Compression and conversion to binary format',
    value: 'CC',
    params: [],
  },
  {
    title: 'Fast tree search',
    value: 'FT',
    params: [params.outGroup],
  },
  {
    title: 'Default tree inference',
    value: 'TI',
    params: [params.outGroup],
  },
  {
    title: 'ML + thorough bootstrap + consensus',
    value: 'ML+tBS+con',
    params: [params.outGroup],
  },
];

const quote = dir => util.is.windows ? `"${dir}"` : dir;

class Binary extends Option {
  constructor(run) { super(run, binaries[binaries.length - 1].name, 'Binary', 'Name of binary'); }
  options = binaries.map(({ name }) => ({ value: name, title: name }));
}

class NumThreads extends Option {
  constructor(run) { super(run, 2, 'Threads', 'Number of cpu threads'); }
  options = range(1, MAX_NUM_CPUS + 1).map(value => ({ value, title: value }));
  @computed get notAvailable() { return !/PTHREADS/.test(this.run.binary.value) && this.run.binary.value !== 'raxml-ng'; }
}

class Analysis extends Option {
  constructor(run) { super(run, 'ML+rBS', 'Analysis', 'Type of analysis'); }
  options = analysisOptions.map(({ value, title }) => ({ value, title }));
}

class RaxmlNgAnalysis extends Option {
  constructor(run) { super(run, 'FT', 'Analysis', 'Type of analysis'); }
  options = raxmlNgAnalysisOptions.map(({ value, title }) => ({ value, title }));
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

//TODO: Another branch lengths option for FT? ('compute brL' vs 'BS brL' for the rest)
class BranchLength extends Option {
  constructor(run) { super(run, false, 'BS brL', 'Compute branch lengths', 'Optimize model parameters and branch lengths for the given input tree'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.brL); }
}

class SHlike extends Option {
  constructor(run) { super(run, false, 'SH-like', 'Compute log-likelihood test', 'Shimodaira-Hasegawa-like procedure'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.SHlike); }
}

class CombinedOutput extends Option {
  constructor(run) { super(run, false, 'Combined output', 'Concatenate output trees'); }
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.combinedOutput); }
  @computed get isUsed() { return this.value && !this.notAvailable }
}

class StartingTree extends Option {
  constructor(run) { super(run, 'Maximum parsimony', 'Starting tree', ''); }
  options = ['Maximum parsimony', 'User defined'].map(value => ({ value, title: value }));
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.startingTree); }
}

class OutGroup extends Option {
  constructor(run) {
    super(run, ['<none>'], 'Outgroup', '');
    this.multiple = true;
  }
  @computed get options() { return ['<none>', ...this.run.taxons].map(value => ({ value, title: value })); }
  @computed get notAvailable() { return !this.run.haveAlignments || !this.run.analysisOption.params.includes(params.outGroup); }
  @computed get cmdValue() { return this.value.includes('<none>') ? '' : this.value.join(',') }
}

class SubstitutionModel extends Option {
  constructor(run) { super(run, 'GTRGAMMA', 'Substitution model'); }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlModelOptions[this.run.dataType];
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map(value => ({ value, title: value }));
  }
  @computed get notAvailable() { return !this.run.haveAlignments; }
  @computed get cmdValue() {
    let model = this.value;
    if (this.run.dataType === 'protein')  {
      model += this.run.alignments[0].aaMatrixName;
    }
    return model;
  }
}

class RaxmlNgSubstitutionModel extends Option {
  constructor(run) { super(run, 'GTR+G', 'Substitution model'); }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlNgModelOptions[this.run.dataType];
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map(value => ({ value, title: value }));
  }
  @computed get notAvailable() { return !this.run.haveAlignments || this.run.alignments.length > 1; }
  @computed get cmdValue() {
    let model = this.value;
    if (this.run.dataType === 'multistate') {
      model = model.replace('x', this.run.multistateNumber.value);
    }
    return model;
  }
}

class AAMatrixName extends Option {
  constructor(run) { super(run, 'BLOSUM62', 'Matrix name', 'Amino Acid Substitution Matrix name'); }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(value => ({ value, title: value }));
  @computed get notAvailable() { return this.run.dataType !== 'protein'; }
}

class MultistateModel extends Option {
  constructor(run) { super(run, 'GTR', 'Multistate model'); }
  options = raxmlSettings.kMultistateSubstitutionModelOptions.options.map(value => ({ value, title: value }));
  @computed get notAvailable() { return this.run.dataType !== 'multistate' || this.run.usesRaxmlNg; }
}

class MultistateNumber extends Option {
  constructor(run) {
    super(run, '', 'Number of states');
    this.placeholder = 'Integer';
  }
  @computed get notAvailable() { return this.run.dataType !== 'multistate' || !this.run.usesRaxmlNg; }
  @computed get error() { return !this.value || !Number.isInteger(Number(this.value)) }
  @computed get helperText() { return this.error && 'You need to give the number of states.' }
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
    shell.showItemInFolder(this.filePath);
  };
  @action openFile = () => {
    shell.openItem(this.filePath);
  };
  @action remove = () => {
    this.setFilePath('');
  }
}


class Run extends StoreBase {
  constructor(parent, id) {
    super();
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

  binary = new Binary(this);
  numThreads = new NumThreads(this);

  raxmlNgSwitch = (raxmlNgParam, raxmlParam) => {
    if (this.usesRaxmlNg) {
      return raxmlNgParam;
    }
    return raxmlParam;
  }

  @computed
  get analysis() {
    return this.raxmlNgSwitch(new RaxmlNgAnalysis(this), new Analysis(this))
  }

  @computed
  get analysisOption() {
    return this.raxmlNgSwitch(raxmlNgAnalysisOptions.find(opt => opt.value === this.analysis.value), analysisOptions.find(opt => opt.value === this.analysis.value));
  }

  @computed
  get substitutionModel() {
    return this.raxmlNgSwitch(new RaxmlNgSubstitutionModel(this), new SubstitutionModel(this));
  }

  // Analysis params
  numRuns = new NumRuns(this);
  numRepetitions = new NumRepetitions(this);
  branchLength = new BranchLength(this);
  sHlike = new SHlike(this);
  combinedOutput = new CombinedOutput(this);
  outGroup = new OutGroup(this);
  aaMatrixName = new AAMatrixName(this);
  multistateModel = new MultistateModel(this);
  multistateNumber = new MultistateNumber(this);
  startingTree = new StartingTree(this);

  tree = new Tree(this);
  @action
  loadTreeFile = () => {
    ipcRenderer.send(ipc.TREE_SELECT, this.id);
  };

  @observable disableCheckUndeterminedSequence = true;

  @observable outputName = 'output';
  @action setOutputName = (value) => {
    this.outputName = filenamify(value.replace(/\s+/g, '_').trim());
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
    return this.outputNameOk ? '' : `Output with that id already exists. New run will use output id '${this.outputNameSafe}'`;
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
    shell.openItem(this.outputDir);
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

  // @observable dataType = 'mixed';
  @computed get dataType() {
    const numAlignments = this.alignments.length;
    if (numAlignments === 0) {
      return 'none';
    }
    const firstType = this.alignments[0].dataType;
    if (numAlignments === 1) {
      return firstType;
    }
    for (let i = 1; i < numAlignments; ++i) {
      if (this.alignments[i].dataType !== firstType) {
        return 'mixed';
      }
    }
    return firstType;
  }

  @observable error = null;

  @computed get missing() {
    if (!this.tree.notAvailable && !this.tree.filePath) {
      return 'Missing tree, please load one.';
    }
    return '';
  }

  @observable running = false;
  @observable finished = false;
  @observable exitCode = 0;
  @action clearFinished = () => {
    this.finished = false;
    this.exitCode = 0;
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

  @computed get usesRaxmlNg() {
    switch (this.binary.value) {
      case 'raxml-ng':
        return true;
      default:
        return false;
    }
  }

  @computed get args() {
    if (this.usesRaxmlNg) {
      return this.raxmlNgArgs();
    }
    return this.raxmlArgs();
  }

  raxmlNgArgs = () => {
    const first = [];
    const second = [];
    const third = [];
    const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end
    switch (this.analysis.value) {
      case 'SC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push('--check');
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.substitutionModel.cmdValue);
        }
        first.push('--prefix', quote(join(this.outputDir, this.outputNameSafe)));
        first.push('--msa', quote(this.finalAlignment.path));
        break;
      case 'CC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push('--parse');
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.substitutionModel.cmdValue);
        }
        first.push('--prefix', quote(join(this.outputDir, this.outputNameSafe)));
        first.push('--msa', quote(this.finalAlignment.path));
        break;
      case 'TI':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#tree-inference
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.substitutionModel.cmdValue);
        }
        first.push('--prefix', quote(join(this.outputDir, this.outputNameSafe)));
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        first.push('--seed', this.seedParsimony);
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        break;
      case 'FT':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#tree-inference
        first.push('--search1');
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.substitutionModel.cmdValue);
        }
        first.push('--prefix', quote(join(this.outputDir, this.outputNameSafe)));
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        first.push('--seed', this.seedParsimony);
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        break;
      case 'ML+tBS+con':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push('--all');
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.substitutionModel.cmdValue);
        }
        first.push('--prefix', quote(join(this.outputDir, this.outputNameSafe)));
        first.push('--seed', this.seedParsimony);
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        first.push('--bs-metric', 'fbp,tbe');
        break;
      default:
    }
    return cmdArgs.filter(args => args.length > 0);
  }

  raxmlArgs = () => {
    const first = [];
    const second = [];
    const third = [];
    const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end

    switch (this.analysis.value) {
      case 'FT': // Fast tree search
        // params: [params.brL, params.SHlike, params.outGroup],
        // cmd= """cd %s %s &&%s %s -f E -p %s %s -n %s -s %s -O -w %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, mod, out_file, seq_file, path_dir, part_f, cmd_temp1,cmd_temp2, winEx)
        //TODO: Where is outGroup? From line 1436 in original code, -o is unchecked
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'E');
        first.push('-p', this.seedParsimony);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.branchLength.value) {
          const treeFile1 = join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const next = [];
          if (!this.numThreads.notAvailable) {
            next.push('-T', this.numThreads.value);
          }
          next.push('-f', 'e');
          next.push('-m', this.substitutionModel.cmdValue);
          if (this.substitutionModel.value.startsWith('ASC_')) {
            next.push('--asc-corr=lewis');
          }
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile1));
          next.push('-n', `brL.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.alignments.length > 1) {
            next.push('-q', quote(this.finalAlignment.partitionFilePath));
          }
          cmdArgs.push(next);
        }
        if (this.sHlike.value) {
          const treeFile2 = this.branchLength.value ?
          join(this.outputDir, `RAxML_result.brL.${this.outputFilenameSafe}`) :
          join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
          const next = [];
          if (!this.numThreads.notAvailable) {
            next.push('-T', this.numThreads.value);
          }
          next.push('-f', 'e');
          next.push('-m', this.substitutionModel.cmdValue);
          if (this.substitutionModel.value.startsWith('ASC_')) {
            next.push('--asc-corr=lewis');
          }
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile2));
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.alignments.length > 1) {
            next.push('-q', quote(this.finalAlignment.partitionFilePath));
          }
          cmdArgs.push(next);
        }
        break;
      case 'ML': // ML search
        // params: [params.SHlike, params.combinedOutput, params.outGroup],
        // cmd= """cd %s %s&&%s %s -f d %s -N %s -O -p %s %s -s %s -n %s %s -w %s %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, mod, BSrep2.get(), random.randrange(1, 1000, 1), o, seq_file, out_file, part_f, path_dir, const_f, result2, cmd_temp2, combine_trees, winEx)
        //TODO: Check conf_f (from line 754 in original source)
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'd');
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        first.push('-N', this.numRuns.value);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-p', this.seedParsimony);
        first.push('-n', this.outputFilenameSafe);
          if (this.outGroup.cmdValue) {
            first.push('-o', this.outGroup.cmdValue);
          }
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.sHlike.value) {
          const treeFile = join(this.outputDir, `RAxML_bestTree.${this.outputFilenameSafe}`);
          const next = [];
          if (!this.numThreads.notAvailable) {
            next.push('-T', this.numThreads.value);
          }
          next.push('-f', 'e');
          next.push('-m', this.substitutionModel.cmdValue);
          if (this.substitutionModel.value.startsWith('ASC_')) {
            next.push('--asc-corr=lewis');
          }
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile));
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.alignments.length > 1) {
            next.push('-q', quote(this.finalAlignment.partitionFilePath));
          }
          cmdArgs.push(next);
        }
        break;
      case 'ML+rBS': // ML + rapid bootstrap
        // params: [params.reps, params.brL, params.outGroup],
        // cmd= """cd %s %s&& %s %s %s -f a -x %s %s %s -p %s -N %s %s -s %s -n %s %s -O -w %s %s %s %s""" \
        // % (winD, raxml_path, runWin, K[0], pro, seed_1, save_brL.get(),mod, seed_2, BSrep.get(), o, seq_file, out_file, \
        // part_f, path_dir, const_f, result, winEx)
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'a');
        first.push('-x', this.seedRapidBootstrap);
        first.push('-p', this.seedParsimony);
        first.push('-N', this.numRepetitions.value);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.branchLength.value) {
          first.push('-k');
        }
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
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
        const outputFilenameSafe1 = `${this.outputNameSafe}R.tre`;
        const outputFilenameSafe2 = `${this.outputNameSafe}B.tre`;
        const treeFile = join(this.outputDir, `RAxML_bestTree.${outputFilenameSafe2}`); // MLtreeR
        const treesFile = join(this.outputDir, `RAxML_bootstrap.${outputFilenameSafe1}`); // trees
        // first wrote RAxML_bootstrap.binary_8R.tre
        // second wrote RAxML_bootstrap.binary_8B.tre

        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-b', this.seedBootstrap);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.branchLength.value) {
          first.push('-k');
        }
        first.push('-p', this.seedParsimony);
        first.push('-N', this.numRepetitions.value);
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        first.push('-n', outputFilenameSafe1);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }

        if (!this.numThreads.notAvailable) {
          second.push('-T', this.numThreads.value);
        }
        second.push('-f', 'd');
        second.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          second.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          second.push('-K', this.multistateModel.value);
        }
        second.push('-p', this.seedParsimony);
        second.push('-N', this.numRuns.value);
        if (this.disableCheckUndeterminedSequence) {
          second.push('-O');
        }
        if (this.outGroup.cmdValue) {
          second.push('-o', this.outGroup.cmdValue);
        }
        second.push('-n', outputFilenameSafe2);
        second.push('-s', quote(this.finalAlignment.path));
        second.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          second.push('-q', quote(this.finalAlignment.partitionFilePath));
        }

        if (!this.numThreads.notAvailable) {
          third.push('-T', this.numThreads.value);
        }
        third.push('-f', 'b');
        third.push('-t', quote(treeFile));
        third.push('-z', quote(treesFile));
        third.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          third.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          third.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          third.push('-O');
        }
        third.push('-n', this.outputFilenameSafe);
        third.push('-s', quote(this.finalAlignment.path));
        third.push('-w', quote(this.outputDir));
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

        const bsTreeFile = join(this.outputDir, `RAxML_bootstrap.${this.outputFilenameSafe}`);
        const consensusOutput = `consensus.${this.outputFilenameSafe}`;

        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        if (this.branchLength.value) {
          first.push('-k');
        }
        first.push('-x', this.seedRapidBootstrap);
        first.push('-p', this.seedParsimony);
        first.push('-N', this.numRepetitions.value);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }

        if (!this.numThreads.notAvailable) {
          second.push('-T', this.numThreads.value);
        }
        second.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          second.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          second.push('-K', this.multistateModel.value);
        }
        second.push('-J', 'MR');
        second.push('-w', quote(this.outputDir));
        second.push('-z', quote(bsTreeFile));
        second.push('-n', consensusOutput);
        break;
      case 'AS': // Ancestral states
        // params: [params.tree],
        // cmd = """cd %s %s &&%s %s -f A -t "%s" -s %s %s -n %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, rooted_tree, seq_file, mod, out_file, path_dir, part_f, winEx)
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'A');
        first.push('-t', quote(this.tree.filePath));
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        break;
      case 'PD': // Pairwise distances
        // params: [params.startingTree],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // cmd = """cd %s %s &&%s %s -f x -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'x');
        first.push('-p', this.seedParsimony);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        if (!this.tree.notAvailable) {
          first.push('-t', quote(this.tree.filePath));
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        break;
      case 'RBS': // Rell bootstraps
        // params: [params.reps, params.brL, params.outGroup],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // 	cmd = """cd %s %s &&%s %s -f D -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // 	% (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
        if (!this.numThreads.notAvailable) {
          first.push('-T', this.numThreads.value);
        }
        first.push('-f', 'D');
        first.push('-p', this.seedParsimony);
        first.push('-m', this.substitutionModel.cmdValue);
        if (this.substitutionModel.value.startsWith('ASC_')) {
          first.push('--asc-corr=lewis');
        }
        if (this.branchLength.value) {
          first.push('-k');
        }
        if (this.outGroup.cmdValue) {
          first.push('-o', this.outGroup.cmdValue);
        }
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          first.push('-O');
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        // if (!this.tree.notAvailable) {
        //   first.push('-t', this.tree.filePath);
        // }
        first.push('-w', quote(this.outputDir));
        if (this.alignments.length > 1) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        break;
      default:
    }

    return cmdArgs.filter(args => args.length > 0);
  }

  @computed get command() {
    return this.args.map(cmdArgs => `${this.binary.value} ${cmdArgs.join(' ')}`).join(' &&\\\n');
  }

  @action
  start = async () => {
    const { id, args, binary, outputDir, outputFilenameSafe: outputFilename, outputNameSafe: outputName, combinedOutput, usesRaxmlNg } = this;
    console.log(`Start run ${id} with args ${args}`);
    this.running = true;
    if (this.outputName !== this.outputNameSafe) {
      this.outputName = this.outputNameSafe;
    }
    if (this.finalAlignment.numAlignments > 1) {
      await this.finalAlignment.writeConcatenatedAlignmentAndPartition();
    }
    ipcRenderer.send(ipc.RUN_START, { id, args, binaryName: binary.value, outputDir, outputFilename, outputName, combinedOutput: combinedOutput.isUsed, usesRaxmlNg });
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
  // @observable dataType = undefined;
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
    ipcRenderer.send(ipc.ALIGNMENT_SELECT);
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
    super.dispose();
  }

  listen = () => {

    this.listenTo(ipc.TREE_SELECTED, this.onTreeSelected);

    this.listenTo(ipc.ALIGNMENT_SELECTED, this.onAlignmentAdded);

    this.listenTo(ipc.OUTPUT_DIR_SELECTED, this.onOutputDirSelected);

    this.listenTo(ipc.RUN_STDOUT, this.onRunStdout);
    this.listenTo(ipc.RUN_STDERR, this.onRunStderr);
    this.listenTo(ipc.RUN_STARTED, this.onRunStarted);
    this.listenTo(ipc.RUN_FINISHED, this.onRunFinished);
    this.listenTo(ipc.RUN_ERROR, this.onRunError);
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
  onRunFinished = (event, { id, resultDir, resultFilenames, exitCode }) => {
    if (id === this.id) {
      console.log(`Process ${id} finished with exitCode '${exitCode}' and result filenames ${resultFilenames} in dir ${resultDir}.`);
      this.resultDir = resultDir;
      this.atomFinished.reportChanged();
      this.finished = true;
      this.exitCode = exitCode;
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

  generateReport = ({ maxStdoutLength = 200 } = {}) => {
    const { command, stdout } = this;
    return {
      command,
      stdout: stdout.length > maxStdoutLength ? `[${stdout.length - maxStdoutLength} more characters]...${stdout.slice(-maxStdoutLength)}` : stdout,
    }
  }
}

export default Run;
