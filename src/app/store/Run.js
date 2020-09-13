import { observable, computed, action, createAtom } from 'mobx';
import { ipcRenderer, shell } from 'electron';
import { range } from 'd3-array';
import cpus from 'cpus';
import Alignment, { FinalAlignment } from './Alignment';
import Option from './Option';
import parsePath from 'parse-filepath';
import { promisedComputed } from 'computed-async-mobx';
import { join } from 'path';
import filenamify from 'filenamify';
import electronutil from 'electron-util';
import fs from 'fs';
import { quote } from '../../common/utils';
import StoreBase from './StoreBase';
import * as raxmlSettings from '../../settings/raxml';
import * as ipc from '../../constants/ipc';

const raxmlModelOptions = raxmlSettings.modelOptions;

export const MAX_NUM_CPUS = cpus().length;

const winBinaries = [
  // TODO: add raxml ng windows exe
  { name: 'raxmlHPC.exe', multithreaded: false, version: '8.2.10' },
  { name: 'raxmlHPC-SSE3.exe', multithreaded: false, version: '8.2.10' },
  { name: 'raxmlHPC-PTHREADS-AVX2.exe', multithreaded: true, version: '8.2.10' },
  { name: 'raxmlHPC-PTHREADS-SSE3.exe', multithreaded: true, version: '8.2.10', initial: true }
];

const allBinaries = electronutil.is.windows
  ? winBinaries
  : [
      { name: 'modeltest-ng', multithreaded: true, version: '0.1.6' },
      { name: 'raxml-ng', multithreaded: true, version: '0.9.0', initial: true },
      { name: 'raxmlHPC', multithreaded: false, version: '8.2.12' },
      { name: 'raxmlHPC-SSE3', multithreaded: false, version: '8.2.12' },
      { name: 'raxmlHPC-PTHREADS-AVX', multithreaded: true, version: '8.2.12' },
      { name: 'raxmlHPC-PTHREADS-SSE3', multithreaded: true, version: '8.2.12' }
    ];

  const binaries = allBinaries.filter(({ multithreaded }) =>
  MAX_NUM_CPUS === 1 ? !multithreaded : true
  );

  const initialBinaryName = binaries.filter(({ initial }) => initial )[0].name;

// Available parameters for different analysis
const params = {
  brL: 'brL',
  SHlike: 'SHlike',
  combinedOutput: 'combinedOutput',
  reps: 'reps',
  repsNg: 'repsNg',
  runs: 'runs',
  tree: 'tree',
  startingTree: 'startingTree',
  outGroup: 'outGroup',
};

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
    title: 'ML tree inference',
    value: 'TI',
    params: [params.runs, params.outGroup],
  },
  {
    title: 'ML + thorough bootstrap + consensus',
    value: 'ML+tBS+con',
    params: [params.runs, params.repsNg, params.outGroup],
  },
  {
    title: 'ML + Transfer Bootstrap Expectation + consensus',
    value: 'ML+TBE+con',
    params: [params.runs, params.repsNg, params.outGroup],
  },
  {
    title: 'Ancestral state reconstruction',
    value: 'AS',
    needTree: true,
    params: [params.tree],
  },
];

class Binary extends Option {
  constructor(run) { super(run, initialBinaryName, 'Binary', 'Name of binary'); }
  options = binaries.map(({ name }) => ({ value: name, title: name }));
  @computed get version() { return binaries.filter(b => b.name === this.value)[0].version };
}

class NumThreads extends Option {
  constructor(run) { super(run, 2, 'Threads', 'Number of cpu threads'); }
  options = range(1, MAX_NUM_CPUS + 1).map(value => ({ value, title: value }));
  @computed get notAvailable() {
    return !/PTHREADS/.test(this.run.binary.value) && !this.run.usesRaxmlNg && !this.run.usesModeltestNg;
  }
}

class Analysis extends Option {
  constructor(run) { super(run, 'ML+rBS', 'Analysis', 'Type of analysis'); }
  options = analysisOptions.map(({ value, title }) => ({ value, title }));
}

class RaxmlNgAnalysis extends Option {
  constructor(run) { super(run, 'TI', 'Analysis', 'Type of analysis'); }
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

class NumRepetitionsNg extends Option {
  constructor(run) { super(run, 100, 'Reps.', 'Number of repetitions'); }
  options = [100, 200, 500, 1000, 10000, 'autoMRE'].map(value => ({ value, title: value }));
  @computed get notAvailable() { return !this.run.analysisOption.params.includes(params.repsNg); }
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

    // Remove options with ascertainment bias correction if the alignment has invariant sites
    if (this.run.finalAlignment.hasInvariantSites) {
      modelSettings.options = modelSettings.options.filter(value => !value.startsWith('ASC_'));;
    }
    return modelSettings.options.map(value => ({ value, title: value }));
  }
  @computed get notAvailable() { return !this.run.haveAlignments || this.run.usesRaxmlNg; }
  @computed get cmdValue() {
    let model = this.value;
    if (this.run.dataType === 'protein')  {
      model += this.run.alignments[0].aaMatrixName;
      model += this.run.empiricalFrequencies.value ? 'F' : '';
    }
    return model;
  }
}

class AAMatrixName extends Option {
  constructor(run) { super(run, 'BLOSUM62', 'Matrix name', 'Amino Acid Substitution Matrix name'); }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(value => ({ value, title: value }));
  @computed get notAvailable() { return this.run.dataType !== 'protein'; }
}

class EmpiricalFrequencies extends Option {
  constructor(run) { super(run, false, 'Emp.Freq.', 'Use empirical base frequencies', 'Use empirical base frequencies instead of a maximum likelihood estimate.'); }
  @computed get notAvailable() { return this.run.dataType !== 'protein'; }
}

class MultistateModel extends Option {
  constructor(run) { super(run, 'GTR', 'Multistate model'); }
  options = raxmlSettings.kMultistateSubstitutionModelOptions.options.map(value => ({ value, title: value }));
  @computed get notAvailable() { return this.run.dataType !== 'multistate' || this.run.usesRaxmlNg; }
}

class TreeFile extends Option {
  constructor(run) { super(run, '', 'Tree', ''); }
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
    shell.openPath(this.filePath);
  };
  @action remove = () => {
    this.setFilePath('');
  }
}

class Tree extends TreeFile {
  @computed get notAvailable() {
    return !(this.run.analysisOption.params.includes(params.tree) ||
    (!this.run.startingTree.notAvailable && this.run.startingTree.value === 'User defined'));
  }
}

class BackboneConstraintTree extends TreeFile {
  @computed get isSet() {
    return this.run.useBackboneConstraint && this.haveFile;
  }
  @computed get canConstraint() {
    const analysisWithConstraint = [
      'ML',
      'ML+rBS',
      'ML+tBS',
      'BS+con',
      'RBS',
      'SC',
      'CC',
      'TI',
      'ML+tBS+con',
      'ML+TBE+con',
    ];
    return analysisWithConstraint.includes(this.run.analysis.value);
  }
  @computed get notAvailable() {
    return !this.run.useBackboneConstraint || !this.canConstraint;
  }
}

class MultifurcatingConstraintTree extends TreeFile {
  @computed get isSet() {
    return this.run.useMultifurcatingConstraint && this.haveFile;
  }
  @computed get canConstraint() {
    const analysisWithConstraint = [
      'ML',
      'ML+rBS',
      'ML+tBS',
      'BS+con',
      'RBS',
      'SC',
      'CC',
      'TI',
      'ML+tBS+con',
      'ML+TBE+con',
    ];
    return analysisWithConstraint.includes(this.run.analysis.value);
  }
  @computed get notAvailable() {
    return !this.run.useMultifurcatingConstraint || !this.canConstraint;
  }
}

class Run extends StoreBase {
  constructor(parent, id) {
    super();
    this.parent = parent;
    this.id = id;
    this.finalAlignment = new FinalAlignment(this);
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
      };
      ipcRenderer.on(onChannel, listener);
      ipcRenderer.send(channel, Object.assign({ id }, payload));
    });
  };

  binary = new Binary(this);
  numThreads = new NumThreads(this);

  raxmlNgSwitch = (raxmlNgParam, raxmlParam) => {
    if (this.usesRaxmlNg) {
      return raxmlNgParam;
    }
    return raxmlParam;
  };

  @computed
  get analysis() {
    return this.raxmlNgSwitch(new RaxmlNgAnalysis(this), new Analysis(this));
  }

  @computed
  get analysisOption() {
    return this.raxmlNgSwitch(
      raxmlNgAnalysisOptions.find((opt) => opt.value === this.analysis.value),
      analysisOptions.find((opt) => opt.value === this.analysis.value)
    );
  }

  // Analysis params
  substitutionModel = new SubstitutionModel(this);
  numRuns = new NumRuns(this);
  numRepetitions = new NumRepetitions(this);
  numRepetitionsNg = new NumRepetitionsNg(this);
  branchLength = new BranchLength(this);
  sHlike = new SHlike(this);
  combinedOutput = new CombinedOutput(this);
  outGroup = new OutGroup(this);
  aaMatrixName = new AAMatrixName(this);
  empiricalFrequencies = new EmpiricalFrequencies(this);
  multistateModel = new MultistateModel(this);
  startingTree = new StartingTree(this);

  tree = new Tree(this);
  backboneConstraint = new BackboneConstraintTree(this);
  multifurcatingConstraint = new MultifurcatingConstraintTree(this);

  @action
  loadTreeFile = () => {
    ipcRenderer.send(ipc.TREE_SELECT, { id: this.id, type: 'tree' });
  };

  @action
  loadBackboneConstraintFile = () => {
    ipcRenderer.send(ipc.TREE_SELECT, {
      id: this.id,
      type: 'backboneConstraint',
    });
  };

  @action
  loadMultifurcatingConstraintFile = () => {
    ipcRenderer.send(ipc.TREE_SELECT, {
      id: this.id,
      type: 'multifurcatingConstraint',
    });
  };

  @observable disableCheckUndeterminedSequence = true;

  @observable outputName = 'output';
  @action setOutputName = (value) => {
    this.outputName = filenamify(value.replace(/\s+/g, '_').trim());
  };

  atomAfterRun; // Trigger atom when run is finished to re-run outputNameAvailable

  outputNameAvailable = promisedComputed(
    { ok: false, resultFilenames: [] },
    async () => {
      const {
        id,
        outputDir,
        outputName,
        outputNamePlaceholder,
        atomAfterRun,
      } = this;
      const defaultValue = {
        id,
        outputDir,
        outputName,
        ok: false,
        notice: 'Checking...',
        outputNameUnused: outputName,
        resultFilenames: [],
      };
      const outputNameToCheck = outputName || outputNamePlaceholder;
      const check = atomAfterRun.reportObserved() || outputNameToCheck;
      if (!check) {
        return defaultValue;
      }
      const result = await this.sendAsync(
        ipc.OUTPUT_CHECK,
        {
          id,
          outputDir,
          outputName: outputNameToCheck,
        },
        ipc.OUTPUT_CHECKED
      );
      return result;
    }
  );

  @computed get outputNameOk() {
    return this.outputNameAvailable.get().ok;
  }

  @computed get outputNameSafe() {
    return (
      this.outputNameAvailable.get().outputNameUnused ||
      this.outputNamePlaceholder
    );
  }

  @computed get outputNameNotice() {
    return this.outputNameOk
      ? ''
      : `Output with that id already exists. New run will use output id '${this.outputNameSafe}'`;
  }

  @computed get outputFilenameSafe() {
    return `${this.outputNameSafe}.tre`;
  }

  @observable outputDir = '';
  @action
  setOutputDir = (dir) => {
    this.outputDir = dir;
  };
  @action
  selectOutputDir = () => {
    ipcRenderer.send(ipc.OUTPUT_DIR_SELECT, this.id);
  };

  @action openOutputDir = () => {
    shell.openPath(this.outputDir);
  };

  @observable.ref showPartitionFor = null;
  @action
  showPartition = (alignment) => {
    this.showPartitionFor = alignment;
  };
  @action
  hidePartition = () => {
    this.showPartition(null);
  };

  // Result
  @observable resultDir = '';
  @computed get resultFilenames() {
    return this.outputNameAvailable.get().resultFilenames || [];
  }

  @computed get haveResult() {
    return this.resultFilenames.length > 0 && this.resultDir === this.outputDir;
  }

  @action openFile = (filePath) => {
    ipcRenderer.send(ipc.FILE_OPEN, filePath);
  };

  @computed get haveAlignments() {
    return this.alignments.length > 0;
  }

  @computed get taxons() {
    return this.haveAlignments ? this.alignments[0].taxons : [];
  }

  // @observable dataType = 'mixed';
  @computed get dataType() {
    return this.finalAlignment.dataType;
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
  };
  atomFinished;

  @computed get ok() {
    return !this.error && !this.missing;
  }

  @computed get startDisabled() {
    return (
      this.alignments.length === 0 ||
      !this.ok ||
      this.running ||
      !this.finalAlignment.partition.isComplete ||
      (this.usesModeltestNg && !this.modelTestCanRun) ||
      (this.usesModeltestNg && this.alignments.length > 1) ||
      this.modelTestIsRunningOnAlignment
    );
  }

  @observable seedParsimony = 123;
  @observable seedRapidBootstrap = 123;
  @observable seedBootstrap = 123;

  @computed get haveRandomSeed() {
    const analysisWithSeed = [
      'FT',
      'ML',
      'ML+rBS',
      'ML+tBS',
      'BS+con',
      'PD',
      'RBS',
      'TI',
      'ML+tBS+con',
      'ML+TBE+con',
    ];
    return analysisWithSeed.includes(this.analysis.value);
  }

  @action randomizeSeed = () => {
    this.seedParsimony = Math.floor(Math.random() * 1000 + 1);
    this.seedRapidBootstrap = Math.floor(Math.random() * 1000 + 1);
    this.seedBootstrap = Math.floor(Math.random() * 1000 + 1);
  };

  @computed get usesRaxmlNg() {
    switch (this.binary.value) {
      case 'raxml-ng':
        return true;
      default:
        return false;
    }
  }

  @computed get usesModeltestNg() {
    switch (this.binary.value) {
      case 'modeltest-ng':
        return true;
      default:
        return false;
    }
  }

  @computed get modelTestCanRun() {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  @computed get modelTestIsRunningOnAlignment() {
    // return this.alignments.some(alignment => alignment.modeltestLoading);
    const running = this.alignments.some(alignment => alignment.modeltestLoading);
    return running;
  }

  @action cancelModeltestOnAlignment = () => {
    this.alignments.forEach(alignment => alignment.cancelModelTest());
  }

  @computed get args() {
    if (this.usesModeltestNg) {
      return this.modeltestNgArgs();
    }
    if (this.usesRaxmlNg) {
      return this.raxmlNgArgs();
    }
    return this.raxmlArgs();
  }

  @computed get ngSubstitutionModelCmd() {
    return this.haveAlignments ? this.alignments[0].ngSubstitutionModelCmd : '';
  }

  @computed get showConverted() {
    const shouldShow = this.alignments
      .map((a) => a.showConverted)
      .some((e) => e);
    return this.haveAlignments && shouldShow;
  }

  @computed get convertedAlignmentFrom() {
    if (!this.haveAlignments || !this.showConverted) {
      return null;
    }
    const converted = this.alignments.filter((a) => a.showConverted);
    return converted[0].convertedFrom;
  }

  @action clearShowConverted = () => {
    for (let i = 0; i < this.alignments.length; i++) {
      this.alignments[i].clearConverted();
    }
  };

  modeltestNgArgs = () => {
    const first = [];
    // data type
    if (this.dataType === 'nucleotide') {
      first.push('-d', 'nt');
    }
    else if (this.dataType === 'protein') {
      first.push('-d', 'aa');
    }
    // alignment file
    first.push('-i', quote(this.finalAlignment.path));
    // output file, modeltest errors if this file already exists
    first.push('-o', quote(join(this.outputDir,`RAxML_GUI_ModelTest_${this.outputNameSafe}`)));
    // modeltest throws errors if the output file already exists
    first.push('--force');
    // Number of processors
    first.push('-p', this.numThreads.value);
    // TODO: in able to support partitioned modeltest we need to change the partition file text
    // https://github.com/ddarriba/modeltest/wiki/Input-Data#partition-files
    // partition scheme
    // if (!this.finalAlignment.partition.isDefault) {
    //   first.push('-q', quote(this.finalAlignment.partitionFilePath));
    // }
    return [first];
  };

  raxmlNgArgs = () => {
    const first = [];
    const second = [];
    const third = [];
    const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end
    switch (this.analysis.value) {
      case 'SC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push('--check');
        if (!this.finalAlignment.partition.isDefault) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.backboneConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.backboneConstraint.filePath)
          );
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.multifurcatingConstraint.filePath)
          );
        }
        break;
      case 'CC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push('--parse');
        if (!this.finalAlignment.partition.isDefault) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.backboneConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.backboneConstraint.filePath)
          );
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.multifurcatingConstraint.filePath)
          );
        }
        break;
      case 'TI':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#tree-inference
        first.push('--msa', quote(this.finalAlignment.path));
        if (!this.finalAlignment.partition.isDefault) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        first.push('--seed', this.seedParsimony);
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        first.push('--tree', `rand{${this.numRuns.value}}`);
        if (this.backboneConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.backboneConstraint.filePath)
          );
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.multifurcatingConstraint.filePath)
          );
        }
        break;
      case 'ML+tBS+con':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push('--all');
        first.push('--msa', quote(this.finalAlignment.path));
        if (!this.finalAlignment.partition.isDefault) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        first.push('--seed', this.seedParsimony);
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        first.push('--bs-metric', 'fbp');
        first.push('--tree', `rand{${this.numRuns.value}}`);
        first.push('--bs-trees', this.numRepetitionsNg.value);
        if (this.backboneConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.backboneConstraint.filePath)
          );
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.multifurcatingConstraint.filePath)
          );
        }
        break;
      case 'ML+TBE+con':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push('--all');
        first.push('--msa', quote(this.finalAlignment.path));
        if (!this.finalAlignment.partition.isDefault) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        first.push('--seed', this.seedParsimony);
        if (!this.numThreads.notAvailable) {
          first.push('--threads', this.numThreads.value);
        }
        if (this.outGroup.cmdValue) {
          first.push('--outgroup', this.outGroup.cmdValue);
        }
        first.push('--bs-metric', 'tbe');
        first.push('--tree', `rand{${this.numRuns.value}}`);
        first.push('--bs-trees', this.numRepetitionsNg.value);
        if (this.backboneConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.backboneConstraint.filePath)
          );
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push(
            '--tree-constraint',
            quote(this.multifurcatingConstraint.filePath)
          );
        }
        break;
      case 'AS':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push('--ancestral');
        first.push('--msa', quote(this.finalAlignment.path));
        if (this.alignments.length > 1) {
          first.push('--model', quote(this.finalAlignment.partitionFilePath));
        } else {
          first.push('--model', this.ngSubstitutionModelCmd);
        }
        first.push(
          '--prefix',
          quote(join(this.outputDir, this.outputNameSafe))
        );
        first.push('--tree', quote(this.tree.filePath));
        break;
      default:
    }
    return cmdArgs.filter((args) => args.length > 0);
  };

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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.branchLength.value) {
          const treeFile1 = join(
            this.outputDir,
            `RAxML_fastTree.${this.outputFilenameSafe}`
          );
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
          if (!this.finalAlignment.partition.isDefault) {
            next.push('-q', quote(this.finalAlignment.partitionFilePath));
          }
          cmdArgs.push(next);
        }
        if (this.sHlike.value) {
          const treeFile2 = this.branchLength.value
            ? join(
                this.outputDir,
                `RAxML_result.brL.${this.outputFilenameSafe}`
              )
            : join(this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}`);
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
          if (!this.finalAlignment.partition.isDefault) {
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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          first.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push('-g', quote(this.multifurcatingConstraint.filePath));
        }
        if (this.sHlike.value) {
          const treeFile = join(
            this.outputDir,
            `RAxML_bestTree.${this.outputFilenameSafe}`
          );
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
          if (!this.finalAlignment.partition.isDefault) {
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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          first.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push('-g', quote(this.multifurcatingConstraint.filePath));
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
        const treeFile = join(
          this.outputDir,
          `RAxML_bestTree.${outputFilenameSafe2}`
        ); // MLtreeR
        const treesFile = join(
          this.outputDir,
          `RAxML_bootstrap.${outputFilenameSafe1}`
        ); // trees
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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          first.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push('-g', quote(this.multifurcatingConstraint.filePath));
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
        if (!this.finalAlignment.partition.isDefault) {
          second.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          second.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          second.push('-g', quote(this.multifurcatingConstraint.filePath));
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
        // if (!this.finalAlignment.partition.isDefault) {
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

        const bsTreeFile = join(
          this.outputDir,
          `RAxML_bootstrap.${this.outputFilenameSafe}`
        );
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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          first.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push('-g', quote(this.multifurcatingConstraint.filePath));
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
        if (this.backboneConstraint.isSet) {
          second.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          second.push('-g', quote(this.multifurcatingConstraint.filePath));
        }
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
        if (!this.finalAlignment.partition.isDefault) {
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
        if (!this.finalAlignment.partition.isDefault) {
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
        if (!this.finalAlignment.partition.isDefault) {
          first.push('-q', quote(this.finalAlignment.partitionFilePath));
        }
        if (this.backboneConstraint.isSet) {
          first.push('-r', quote(this.backboneConstraint.filePath));
        }
        if (this.multifurcatingConstraint.isSet) {
          first.push('-g', quote(this.multifurcatingConstraint.filePath));
        }
        break;
      default:
    }

    return cmdArgs.filter((args) => args.length > 0);
  };

  @computed get command() {
    return this.args
      .map((cmdArgs) => `${this.binary.value} ${cmdArgs.join(' ')}`)
      .join(' &&\\\n');
  }

  @computed get settingsFileContent() {
    let text = `Your analaysis was run as follows:
Analysis: ${this.analysisOption.title}
Binary: ${this.binary.value} version ${this.binary.version}
Results saved to: ${this.outputDir}
`;
    let argumentext = 'RAxML was called with these arguments:\n';
    this.args.map(
      (arg, index) => (argumentext += `${index + 1}.) ${arg.join(' ')}\n`)
    );
    text += argumentext;
    // TODO: should we be more precise about what the single params mean?
    //     text += `To repeat the analysis use the following seeds:
    // Bootstrap seed: ${this.seedBootstrap}
    // Parsimony seed: ${this.seedParsimony}`;
    return text;
  }

  @computed get settingsFilePath() {
    const raxmlSettingsFilePath = join(
      `${this.outputDir}`,
      `RAxML_GUI_Settings.${this.outputNameSafe}.txt`
    );
    const raxmlNgSettingsFilePath = join(
      `${this.outputDir}`,
      `${this.outputNameSafe}.raxml.settings`
    );
    return this.raxmlNgSwitch(raxmlNgSettingsFilePath, raxmlSettingsFilePath);
  }

  @action
  writeSettings = async () => {
    try {
      console.log(`Writing settings to ${this.settingsFilePath}...`);
      await fs.writeFileSync(this.settingsFilePath, this.settingsFileContent);
    } catch (err) {
      console.error('Error writing settings:', err);
      throw err;
    }
  };

  @action
  start = async () => {
    const {
      id,
      args,
      binary,
      outputDir,
      outputFilenameSafe: outputFilename,
      outputNameSafe: outputName,
      combinedOutput,
      usesRaxmlNg,
      usesModeltestNg,
    } = this;

    if (this.finalAlignment.numSequences <= 3) {
      // TODO: how to throw error here
      // throw new UserFixError('To start a run with RAxML the final alignment needs to have at least three sequences.');
    }

    console.log(`Start run ${id} with args ${args}`);
    this.running = true;
    if (this.outputName !== this.outputNameSafe) {
      this.outputName = this.outputNameSafe;
    }
    if (this.finalAlignment.numAlignments > 1) {
      await this.finalAlignment.writeConcatenatedAlignmentAndPartition();
    } else if (!this.finalAlignment.partition.isDefault) {
      await this.finalAlignment.writePartition();
    }
    await this.writeSettings();
    ipcRenderer.send(ipc.RUN_START, {
      id,
      args,
      binaryName: binary.value,
      outputDir,
      outputFilename,
      outputName,
      combinedOutput: combinedOutput.isUsed,
      usesRaxmlNg,
      usesModeltestNg,
    });
  };

  @action
  cancel = () => {
    ipcRenderer.send(ipc.RUN_CANCEL, this.id);
    this.afterRun();
  };

  @action
  afterRun = () => {
    this.running = false;
    this.atomAfterRun.reportChanged();
  };

  @observable alignments = [];
  @observable code = undefined;
  @observable data = '';
  @observable path = undefined;
  @observable stdout = '';
  @observable stderr = '';

  @observable useBackboneConstraint = false;
  @observable useMultifurcatingConstraint = false;

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
    return this.alignments.findIndex((alignment) => alignment.id === id) >= 0;
  };

  @action
  addAlignments = (alignments) => {
    alignments.forEach(({ path }) => {
      if (!this.haveAlignment(path)) {
        this.alignments.push(new Alignment(this, path));
        if (this.alignments.length === 1) {
          this.setOutputName(this.alignments[0].name);
          if (!this.outputDir) {
            this.setOutputDir(this.alignments[0].dir);
          }
        }
      }
    });
  };

  @action
  removeAlignment = (alignment) => {
    const oldDataType = this.dataType;
    const index = this.alignments.indexOf(alignment);
    if (index >= 0) {
      this.alignments.splice(index, 1);
    }
    if (this.haveAlignments) {
      // this.dataType is computed automatically with the reduced set, reset to default if changed (from mixed or multistate)
      if (this.dataType !== oldDataType) {
        this.substitutionModel.value = raxmlModelOptions[this.dataType].default;
      }
    } else {
      this.reset();
    }
  };

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
  };

  dispose = () => {
    this.cancel();
    this.unlisten();
  };

  listen = () => {
    this.listenTo(ipc.TREE_SELECTED, this.onTreeSelected);
    this.listenTo(ipc.ALIGNMENT_SELECTED, this.onAlignmentAdded);
    this.listenTo(ipc.OUTPUT_DIR_SELECTED, this.onOutputDirSelected);
    this.listenTo(ipc.RUN_STDOUT, this.onRunStdout);
    this.listenTo(ipc.RUN_STDERR, this.onRunStderr);
    this.listenTo(ipc.RUN_STARTED, this.onRunStarted);
    this.listenTo(ipc.RUN_FINISHED, this.onRunFinished);
    this.listenTo(ipc.RUN_ERROR, this.onRunError);
  };

  // -----------------------------------------------------------
  // Listeners
  // -----------------------------------------------------------

  @action
  onTreeSelected = (event, { id, type, filePath }) => {
    if (id === this.id) {
      switch (type) {
        case 'tree':
          this.tree.setFilePath(filePath);
          break;
        case 'backboneConstraint':
          this.backboneConstraint.setFilePath(filePath);
          break;
        case 'multifurcatingConstraint':
          this.multifurcatingConstraint.setFilePath(filePath);
          break;
        default:
          break;
      }
    }
  };

  @action
  onAlignmentAdded = (event, data) => {
    this.addAlignments(data);
  };

  @action
  onOutputDirSelected = (event, { id, outputDir }) => {
    this.setOutputDir(outputDir);
  };

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
      console.log(
        `Process ${id} finished with exitCode '${exitCode}' and result filenames ${resultFilenames} in dir ${resultDir}.`
      );
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

  @action
  onBackboneConstraint = (event, params) => {
    this.useBackboneConstraint = !this.useBackboneConstraint;
  };

  @action
  onMultifurcatingConstraint = (event, params) => {
    this.useMultifurcatingConstraint = !this.useMultifurcatingConstraint;
  };

  generateReport = ({ maxStdoutLength = 200 } = {}) => {
    const { command, stdout } = this;
    return {
      command,
      stdout:
        stdout.length > maxStdoutLength
          ? `[${
              stdout.length - maxStdoutLength
            } more characters]...${stdout.slice(-maxStdoutLength)}`
          : stdout,
    };
  };
}

export default Run;
