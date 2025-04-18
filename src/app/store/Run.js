import { observable, computed, action, createAtom } from 'mobx';
import { ipcRenderer, shell } from 'electron';
import { range } from 'd3-array';
import cpus from 'cpus';
import parsePath from 'parse-filepath';
import { promisedComputed } from 'computed-async-mobx';
import { join } from 'path';
import filenamify from 'filenamify';
import util from 'util';
import fs from 'fs';
import os from 'os';

import Alignment, { FinalAlignment } from './Alignment';
import AstralTree from './AstralTree';
import Option from './Option';
import StoreBase from './StoreBase';
import { is, quote } from '../../common/utils';
import * as raxmlSettings from '../../settings/raxml';
import * as ipc from '../../constants/ipc';
import _ from 'lodash';
import UserFixError from '../../common/errors';

const readFile = util.promisify(fs.readFile);

const raxmlMatrixOptions = raxmlSettings.matrixOptions;
const raxmlRateOptions = raxmlSettings.rateOptions;
const raxmlIOptions = raxmlSettings.iOptions;
const raxmlAscertainmentOptions = raxmlSettings.ascertainmentOptions;

export const MAX_NUM_CPUS = cpus().length;

// On Windows 7 (= 6.1) use older versions of RAxML
const [majorVersion, minorVersion] = os.release().split('.');
const winBinaries =
  majorVersion === '6' && minorVersion === '1'
    ? [
        // TODO: add raxml ng windows exe
        // TODO: Crashes on Win7, disabled for now
        // { name: 'modeltest-ng.exe', version: '0.1.7' },
        {
          name: 'raxmlHPC_Win7.exe',
          multithreaded: false,
          version: '8.2.10',
          type: 'raxml',
        },
        {
          name: 'raxmlHPC-SSE3_Win7.exe',
          multithreaded: false,
          version: '8.2.10',
          type: 'raxml',
        },
        // TODO: Crashes on Win7, disabled for now
        // {
        //   name: 'raxmlHPC-PTHREADS-AVX_Win7.exe',
        //   multithreaded: true,
        //   version: '8.2.10',
        // },
        {
          name: 'raxmlHPC-PTHREADS-SSE3_Win7.exe',
          multithreaded: true,
          version: '8.2.10',
          initial: true,
          type: 'raxml',
        },
        // TODO: put back in Astral
        // {
        //   name: 'astral.5.7.8.jar',
        //   multithreaded: false,
        //   version: '5.7.8',
        //   type: 'astral',
        // },
      ]
    : [
        // TODO: add raxml ng windows exe
        { name: 'modeltest-ng.exe', version: '0.1.7', type: 'modeltest' },
        {
          name: 'raxmlHPC.exe',
          multithreaded: false,
          version: '8.2.12',
          type: 'raxml',
        },
        {
          name: 'raxmlHPC-SSE3.exe',
          multithreaded: false,
          version: '8.2.12',
          type: 'raxml',
        },
        {
          name: 'raxmlHPC-PTHREADS-AVX.exe',
          multithreaded: true,
          version: '8.2.12',
          type: 'raxml',
        },
        {
          name: 'raxmlHPC-PTHREADS-SSE3.exe',
          multithreaded: true,
          version: '8.2.12',
          initial: true,
          type: 'raxml',
        },
        // TODO: put back in Astral
        // {
        //   name: 'astral.5.7.8.jar',
        //   multithreaded: false,
        //   version: '5.7.8',
        //   type: 'astral',
        // },
      ];

const likelyARM = os.arch().includes('arm64') || os.cpus()[0].model.includes('Apple');
const armBinaries = [
  {
    name: 'modeltest-ng-ARM64',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  }
];
const x64Binaries = [
  {
    name: 'modeltest-ng',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  }
];

const allBinaries = is.windows
  ? winBinaries
  : [
      ...(!likelyARM ? x64Binaries : armBinaries),
      {
        name: 'raxml-ng',
        multithreaded: true,
        version: '1.2.2',
        initial: true,
        type: 'raxml',
      },
      {
        name: 'raxmlHPC',
        multithreaded: false,
        version: '8.2.12',
        type: 'raxml',
      },
      {
        name: 'raxmlHPC-SSE3',
        multithreaded: false,
        version: '8.2.12',
        type: 'raxml',
      },
      {
        name: 'raxmlHPC-PTHREADS-AVX',
        multithreaded: true,
        version: '8.2.12',
        type: 'raxml',
      },
      {
        name: 'raxmlHPC-PTHREADS-SSE3',
        multithreaded: true,
        version: '8.2.12',
        type: 'raxml',
      },
      // TODO: put back in Astral
      // {
      //   name: 'astral.5.7.8.jar',
      //   multithreaded: false,
      //   version: '5.7.8',
      //   type: 'astral',
      // },
    ];

const binaries = allBinaries.filter(({ multithreaded }) =>
  MAX_NUM_CPUS === 1 ? !multithreaded : true
);

const initialBinaryName = binaries.filter(({ initial }) => initial)[0].name;

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
    params: [
      params.runs,
      params.SHlike,
      params.combinedOutput,
      params.outGroup,
    ],
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
  },
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
    title: 'ML + transfer bootstrap expectation + consensus',
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
  constructor(run) {
    super(run, initialBinaryName, 'Binary', 'Name of binary');
  }
  options = binaries.map(({ name }) => ({ value: name, title: name }));
  @computed get version() {
    return binaries.filter((b) => b.name === this.value)[0].version;
  }
  @computed get type() {
    return binaries.filter((b) => b.name === this.value)[0].type;
  }
}

class NumThreads extends Option {
  constructor(run) {
    super(run, 2, 'Threads', 'Number of cpu threads');
  }
  options = range(1, MAX_NUM_CPUS + 1).map((value) => ({
    value,
    title: value,
  }));
  @computed get notAvailable() {
    return !(
      /PTHREADS/.test(this.run.binary.value) || this.run.usesModeltestNg
    );
  }
}

class Analysis extends Option {
  constructor(run) {
    super(run, 'ML+rBS', 'Analysis', 'Type of analysis');
  }
  options = analysisOptions.map(({ value, title }) => ({ value, title }));
}

class RaxmlNgAnalysis extends Option {
  constructor(run) {
    super(run, 'ML+TBE+con', 'Analysis', 'Type of analysis');
  }
  options = raxmlNgAnalysisOptions.map(({ value, title }) => ({
    value,
    title,
  }));
}

class NumRuns extends Option {
  constructor(run) {
    super(run, 1, 'Runs', 'Number of runs');
  }
  options = [1, 10, 20, 50, 100, 500].map((value) => ({ value, title: value }));
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.runs);
  }
}

class NumRepetitions extends Option {
  constructor(run) {
    super(run, 100, 'Reps.', 'Number of repetitions');
  }
  options = [
    100,
    200,
    500,
    1000,
    10000,
    'autoMR',
    'autoMRE',
    'autoMRE_IGN',
    'autoFC',
  ].map((value) => ({ value, title: value }));
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.reps);
  }
}

class NumRepetitionsNg extends Option {
  constructor(run) {
    super(run, 100, 'Reps.', 'Number of repetitions');
  }
  options = [100, 200, 500, 1000, 10000, 'autoMRE'].map((value) => ({
    value,
    title: value,
  }));
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.repsNg);
  }
}

//TODO: Another branch lengths option for FT? ('compute brL' vs 'BS brL' for the rest)
class BranchLength extends Option {
  constructor(run) {
    super(
      run,
      false,
      'BS brL',
      'Compute branch lengths',
      'Optimize model parameters and branch lengths for the given input tree'
    );
  }
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.brL);
  }
}

class SHlike extends Option {
  constructor(run) {
    super(
      run,
      false,
      'SH-like',
      'Compute log-likelihood test',
      'Shimodaira-Hasegawa-like procedure'
    );
  }
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.SHlike);
  }
}

class CombinedOutput extends Option {
  constructor(run) {
    super(run, false, 'Combined output', 'Concatenate output trees');
  }
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.combinedOutput);
  }
  @computed get isUsed() {
    return this.value && !this.notAvailable;
  }
}

class StartingTree extends Option {
  constructor(run) {
    super(run, 'Maximum parsimony', 'Starting tree', '');
  }
  options = ['Maximum parsimony', 'User defined'].map((value) => ({
    value,
    title: value,
  }));
  @computed get notAvailable() {
    return !this.run.analysisOption.params.includes(params.startingTree);
  }
}

class OutGroup extends Option {
  constructor(run) {
    super(run, ['<none>'], 'Outgroup', '');
    this.multiple = true;
  }
  @computed get options() {
    return ['<none>', ...this.run.taxons].map((value) => ({
      value,
      title: value,
    }));
  }

  @action setValue = (value) => {
    if (this.value.includes('<none>')) {
      this.value = value.filter((v) => v !== '<none>');
      return;
    }
    if (!this.value.includes('<none>') && value.includes('<none>')) {
      this.value = value.filter((v) => v === '<none>');
      return;
    }
    this.value = value;
  };

  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      !this.run.analysisOption.params.includes(params.outGroup)
    );
  }
  @computed get cmdValue() {
    return this.value.includes('<none>') ? '' : this.value.join(',');
  }
}

class SubstitutionMatrix extends Option {
  constructor(run) {
    super(run, 'GTR', 'Substitution matrix');
  }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlMatrixOptions[this.run.dataType];
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map((value) => ({
      value,
      title: value === 'GTR' ? value : `${value} + GAMMA`,
    }));
  }
  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      this.run.dataType === 'binary' ||
      this.run.dataType === 'protein' ||
      this.run.dataType === 'multistate' ||
      this.run.usesRaxmlNg
    );
  }
  @computed get cmdValue() {
    if (this.run.dataType === 'binary') {
      return 'BIN';
    }
    if (this.run.dataType === 'protein') {
      return 'PROT';
    }
    if (this.run.dataType === 'multistate') {
      return 'MULTI';
    }
    if (this.value === 'JC' || this.value === 'K80' || this.value === 'HKY') {
      return 'GTR';
    }
    return this.value;
  }
  @computed get extraCmdValue() {
    switch (this.value) {
      case 'JC':
        return '--JC69';
      case 'K80':
        return '--K80';
      case 'HKY':
        return '--HKY85';
      default:
        return '';
    }
  }
  @computed get notGTR() {
    return this.value !== 'GTR';
  }
}

class SubstitutionRate extends Option {
  constructor(run) {
    super(run, 'GAMMA', 'Substitution rates');
  }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlRateOptions;
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map((value) => ({ value, title: value }));
  }
  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      ((this.run.dataType === 'dna' ||
        this.run.dataType === 'rna' ||
        this.run.dataType === 'nucleotide') &&
        this.run.substitutionMatrix.notGTR) ||
      this.run.usesRaxmlNg
    );
  }
  @computed get cmdValue() {
    if (this.run.substitutionMatrix.notGTR) {
      return 'GAMMA';
    }
    return this.value;
  }
  @computed get isCAT() {
    return this.value === 'CAT';
  }
}

class SubstitutionI extends Option {
  constructor(run) {
    super(run, 'none', 'Proportion of invariant sites');
  }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlIOptions;
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map((value) => ({ value, title: value }));
  }
  @computed get notAvailable() {
    return (
      this.run.substitutionAscertainment.isSet ||
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg
    );
  }
  @computed get cmdValue() {
    return this.value === 'none' ? '' : 'I';
  }
  @computed get isSet() {
    return this.value !== 'none';
  }
}

class SubstitutionAscertainment extends Option {
  constructor(run) {
    super(run, 'none', 'Ascertainment bias correction');
  }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlAscertainmentOptions;
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map((value) => ({ value, title: value }));
  }
  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg ||
      this.run.dataType === 'mixed' ||
      this.run.finalAlignment.hasInvariantSites ||
      this.run.substitutionI.isSet
    );
  }
  @computed get cmdValue() {
    return this.value === 'none' ? '' : 'ASC_';
  }
  @computed get extraCmdValue() {
    switch (this.value) {
      case "Lewis' method":
        return '--asc-corr=lewis';
      case "Felsenstein's method":
        return '--asc-corr=felsenstein';
      case "Stamatakis' method":
        return '--asc-corr=stamatakis';
      default:
        return '';
    }
  }
  @computed get isSet() {
    return this.value !== 'none';
  }
}

class AAMatrixName extends Option {
  constructor(run) {
    super(
      run,
      'BLOSUM62',
      'Matrix name',
      'Amino Acid Substitution Matrix name'
    );
  }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(
    (value) => ({ value, title: value })
  );
  @computed get notAvailable() {
    return this.run.dataType !== 'protein';
  }
}

class EstimatedFrequencies extends Option {
  constructor(run) {
    super(
      run,
      false,
      'ML Freq.',
      'Estimated base frequencies',
      'Use estimated base frequencies instead of empirical.'
    );
  }
  @computed get notAvailable() {
    return this.run.dataType === 'protein' || this.run.usesRaxmlNg;
  }
}

class BaseFrequencies extends Option {
  constructor(run) {
    super(
      run,
      'default',
      'Base frequencies',
      'Empirical, ML estimated or model based base frequencies'
    );
  }
  options = [
    { title: 'From model', value: 'default' },
    { title: 'Empirical', value: 'F' },
    { title: 'Estimated (ML)', value: 'X' },
  ];
  @computed get notAvailable() {
    return this.run.dataType !== 'protein' || this.run.usesRaxmlNg;
  }
}

class MultistateModel extends Option {
  constructor(run) {
    super(run, 'GTR', 'Multistate model');
  }
  options = raxmlSettings.kMultistateSubstitutionModelOptions.options.map(
    (value) => ({ value, title: value })
  );
  @computed get notAvailable() {
    return this.run.dataType !== 'multistate' || this.run.usesRaxmlNg;
  }
}

class TreeFile extends Option {
  constructor(run) {
    super(run, '', 'Tree', '');
  }
  @observable filePath = '';
  @computed get haveFile() {
    return !!this.filePath;
  }
  @computed get filename() {
    return parsePath(this.filePath).basename;
  }
  @computed get name() {
    return parsePath(this.filePath).name;
  }
  @computed get dir() {
    return parsePath(this.filePath).dir;
  }
  @action setFilePath = (filePath) => {
    this.filePath = filePath;
  };
  @action openFolder = () => {
    shell.showItemInFolder(this.filePath);
  };
  @action openFile = () => {
    shell.openPath(this.filePath);
  };
  @action remove = () => {
    this.setFilePath('');
  };
}

class Tree extends TreeFile {
  @computed get notAvailable() {
    return !(
      this.run.analysisOption.params.includes(params.tree) ||
      (!this.run.startingTree.notAvailable &&
        this.run.startingTree.value === 'User defined')
    );
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
    this.modeltestName = binaries.filter((b) =>
      b.name.includes('modeltest')
    )[0]?.name;
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
  substitutionMatrix = new SubstitutionMatrix(this);
  substitutionI = new SubstitutionI(this);
  substitutionRate = new SubstitutionRate(this);
  substitutionAscertainment = new SubstitutionAscertainment(this);
  numRuns = new NumRuns(this);
  numRepetitions = new NumRepetitions(this);
  numRepetitionsNg = new NumRepetitionsNg(this);
  branchLength = new BranchLength(this);
  sHlike = new SHlike(this);
  combinedOutput = new CombinedOutput(this);
  outGroup = new OutGroup(this);
  aaMatrixName = new AAMatrixName(this);
  estimatedFrequencies = new EstimatedFrequencies(this);
  baseFrequencies = new BaseFrequencies(this);
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
      const { id, outputDir, outputName, outputNamePlaceholder, atomAfterRun } =
        this;
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

  @computed get hasAstralTree() {
    return !!this.astralTree;
  }

  @computed get taxons() {
    return this.haveAlignments ? this.alignments[0].taxons : [];
  }

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
      (this.alignments.length === 0 && !this.hasAstralTree) ||
      !this.ok ||
      this.running ||
      !this.finalAlignment.partition.isComplete ||
      (this.usesModeltestNg && !this.modelTestCanRun) ||
      (this.usesModeltestNg && this.alignments.length > 1) ||
      this.modelTestIsRunningOnAlignment
    );
  }

  @observable randomSeed = Math.floor(1000000 * Math.random());
  @computed get seedParsimony() {
    return this.randomSeed;
  }
  @computed get seedRapidBootstrap() {
    return this.randomSeed;
  }
  @computed get seedBootstrap() {
    return this.randomSeed;
  }

  @action setRandomSeed = (value) => {
    const v = Number(value);
    if (!Number.isNaN(v) && v !== 0 && v < 1e6) {
      this.randomSeed = v;
    }
  };

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

  @computed get usesRaxmlNg() {
    return this.binary.value.includes('raxml-ng');
  }

  @computed get usesModeltestNg() {
    return this.binary.value.includes('modeltest-ng');
  }

  @computed get inputIsAlignment() {
    return this.usesModeltest || this.usesRaxml;
  }

  @computed get inputIsTree() {
    return this.usesAstral;
  }

  @computed get usesModeltest() {
    return this.binary.type === 'modeltest';
  }

  @computed get usesRaxml() {
    return this.binary.type === 'raxml';
  }

  @computed get usesAstral() {
    return this.binary.type === 'astral';
  }

  @computed get modelTestCanRun() {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  @computed get modelTestIsRunningOnAlignment() {
    const running = this.alignments.some(
      (alignment) => alignment.modeltestLoading
    );
    return running;
  }

  @action cancelModeltestOnAlignment = () => {
    this.alignments.forEach((alignment) => alignment.cancelModelTest());
  };

  @computed get args() {
    if (this.usesAstral) {
      return this.astralArgs();
    }
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

  @computed get showModifiedSnack() {
    const shouldShow = this.alignments
      .map((a) => a.showModifiedSnack)
      .some((e) => e);
    return this.haveAlignments && shouldShow;
  }

  @computed get showModifiedDialog() {
    const shouldShow = this.alignments
      .map((a) => a.showModifiedDialog)
      .some((e) => e);
    return this.haveAlignments && shouldShow;
  }

  @computed get modificationMessages() {
    const messages = [];
    this.alignments.map((a) => {
      messages.push(a.name + ':\n');
      a.modificationMessages.map((b) => messages.push(b + '\n'));
    });
    return messages;
  }

  @computed get converted() {
    const converted = this.alignments.map((a) => a.converted).some((e) => e);
    return this.haveAlignments && converted;
  }

  @computed get modified() {
    const modified = this.alignments.map((a) => a.modified).some((e) => e);
    return this.haveAlignments && modified;
  }

  @computed get convertedAlignmentFrom() {
    if (!this.haveAlignments) {
      return null;
    }
    const convertedAlignments = this.alignments.filter((a) => a.converted);
    return convertedAlignments[0].convertedFrom;
  }

  @action clearShowModified = () => {
    for (let i = 0; i < this.alignments.length; i++) {
      this.alignments[i].clearModified();
    }
  };

  @computed get raxmlSubstitutionModelCmd() {
    let model =
      this.substitutionAscertainment.cmdValue +
      this.substitutionMatrix.cmdValue +
      this.substitutionRate.cmdValue +
      this.substitutionI.cmdValue;
    if (this.dataType === 'protein') {
      model += this.alignments[0].aaMatrixName;
      const { value: suffix } = this.baseFrequencies;
      model += suffix === 'default' ? '' : suffix;
    } else {
      if (this.estimatedFrequencies.value) {
        model += 'X';
      }
    }
    return model;
  }

  astralArgs = () => {
    const first = [];
    first.push('-i', quote(this.astralTree?.path));
    first.push(
      '-o',
      quote(join(this.outputDir, `ASTRAL_${this.outputNameSafe}.tre`))
    );
    return [first];
  };

  modeltestNgArgs = () => {
    const first = [];
    // data type
    if (this.dataType === 'nucleotide') {
      first.push('-d', 'nt');
    } else if (this.dataType === 'protein') {
      first.push('-d', 'aa');
    }
    // alignment file
    first.push('-i', quote(this.finalAlignment.path));
    // output file, modeltest errors if this file already exists
    first.push(
      '-o',
      quote(join(this.outputDir, `RAxML_GUI_ModelTest_${this.outputNameSafe}`))
    );
    // modeltest throws errors if the output file already exists
    first.push('--force');
    // Number of processors
    first.push('-p', this.numThreads.value);
    // TODO: in able to support partitioned modeltest we need to change the partition file text
    // https://github.com/ddarriba/modeltest/wiki/Input-Data#partition-files
    // partition scheme
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        if (this.havePartitionFile) {
          first.push('--model', quote(this.partitionFile));
        } else if (this.alignments.length > 1) {
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
    // Remove items that are only empty strings
    cmdArgs.forEach((args) => _.remove(args, (n) => n === ''));
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
          next.push('-m', this.raxmlSubstitutionModelCmd);
          next.push(this.substitutionMatrix.extraCmdValue);
          next.push(this.substitutionAscertainment.extraCmdValue);
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile1));
          next.push('-n', `brL.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.havePartitionFile) {
            next.push('-q', quote(this.partitionFile));
          } else if (!this.finalAlignment.partition.isDefault) {
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
          next.push('-m', this.raxmlSubstitutionModelCmd);
          next.push(this.substitutionMatrix.extraCmdValue);
          next.push(this.substitutionAscertainment.extraCmdValue);
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile2));
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.havePartitionFile) {
            next.push('-q', quote(this.partitionFile));
          } else if (!this.finalAlignment.partition.isDefault) {
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
          next.push('-m', this.raxmlSubstitutionModelCmd);
          next.push(this.substitutionMatrix.extraCmdValue);
          next.push(this.substitutionAscertainment.extraCmdValue);
          if (!this.multistateModel.notAvailable) {
            next.push('-K', this.multistateModel.value);
          }
          next.push('-t', quote(treeFile));
          next.push('-n', `sh.${this.outputFilenameSafe}`);
          next.push('-s', quote(this.finalAlignment.path));
          next.push('-w', quote(this.outputDir));
          if (this.havePartitionFile) {
            next.push('-q', quote(this.partitionFile));
          } else if (!this.finalAlignment.partition.isDefault) {
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        second.push('-m', this.raxmlSubstitutionModelCmd);
        second.push(this.substitutionMatrix.extraCmdValue);
        second.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          second.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        third.push('-m', this.raxmlSubstitutionModelCmd);
        third.push(this.substitutionMatrix.extraCmdValue);
        third.push(this.substitutionAscertainment.extraCmdValue);
        if (!this.multistateModel.notAvailable) {
          third.push('-K', this.multistateModel.value);
        }
        if (this.disableCheckUndeterminedSequence) {
          third.push('-O');
        }
        third.push('-n', this.outputFilenameSafe);
        third.push('-s', quote(this.finalAlignment.path));
        third.push('-w', quote(this.outputDir));

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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        second.push('-m', this.raxmlSubstitutionModelCmd);
        second.push(this.substitutionMatrix.extraCmdValue);
        second.push(this.substitutionAscertainment.extraCmdValue);
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
        if (!this.multistateModel.notAvailable) {
          first.push('-K', this.multistateModel.value);
        }
        first.push('-n', this.outputFilenameSafe);
        first.push('-s', quote(this.finalAlignment.path));
        first.push('-w', quote(this.outputDir));
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
        first.push('-m', this.raxmlSubstitutionModelCmd);
        first.push(this.substitutionMatrix.extraCmdValue);
        first.push(this.substitutionAscertainment.extraCmdValue);
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
        if (this.havePartitionFile) {
          first.push('-q', quote(this.partitionFile));
        } else if (!this.finalAlignment.partition.isDefault) {
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
    // Remove items that are only empty strings
    cmdArgs.forEach((args) => _.remove(args, (n) => n === ''));
    return cmdArgs.filter((args) => args.length > 0);
  };

  @computed get command() {
    if (this.usesAstral) {
      return this.args
        .map((cmdArgs) => `java -jar ${this.binary.value} ${cmdArgs.join(' ')}`)
        .join(' &&\\\n');
    }
    return this.args
      .map((cmdArgs) => `${this.binary.value} ${cmdArgs.join(' ')}`)
      .join(' &&\\\n');
  }

  @computed get settingsFileContent() {
    let text = `The analysis was run using raxmlGUI 2.0 (version ${this.version}) as follows:
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
    return join(
      `${this.outputDir}`,
      `RAxML_GUI_Settings_${this.outputNameSafe}.txt`
    );
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

  startAstral = async () => {
    const { id, binary, args } = this;
    console.log(`Start astral run ${id}`);
    this.running = true;
    ipcRenderer.send(ipc.ASTRAL_REQUEST, {
      id,
      binaryName: binary.value,
      args,
    });
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
      finalAlignment,
    } = this;

    // If binary is astral use start in seperate function
    if (this.usesAstral) {
      return this.startAstral();
    }

    // Less than 4 sequences and RAxML would error out
    if (this.finalAlignment.numSequences <= 3) {
      this.parent.onError(
        new UserFixError(
          'To start a run with RAxML the final alignment needs to have at least four sequences.'
        )
      );
      return;
    }

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
    console.log(`Start run ${id} with args ${args}`);
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
      inputPath: finalAlignment.path,
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
  @observable astralTree = undefined;
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
    ipcRenderer.send(ipc.ALIGNMENT_SELECT, this.id);
  };

  @action
  loadAstralTree = () => {
    ipcRenderer.send(ipc.ASTRAL_FILE_SELECT, this.id);
  };

  haveAlignment = (id) => {
    // TODO: Input.js queries without id, doe it work as expected? Later queries with path instead of id
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
  addAstralFiles = ({ path }) => {
    if (!this.hasAstralTree) {
      this.astralTree = new AstralTree(this, path);
      this.setOutputName(this.astralTree.name);
      if (!this.outputDir) {
        this.setOutputDir(this.astralTree.dir);
      }
    }
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
        // This parameter is deleted, but there seems to be no need for updating other params
        // this.substitutionModel.value = raxmlModelOptions[this.dataType].default;
      }
    } else {
      this.reset();
    }
  };

  @action
  removeAstralTree = () => {
    this.astralTree = null;
  };

  @computed get canLoadAlignment() {
    return (
      (this.binary.type === 'raxml' || this.binary.type === 'modeltest') &&
      !this.havePartitionFile
    );
  }

  @computed get canLoadAstralTree() {
    return this.usesAstral && !this.hasAstralTree;
  }

  @observable partitionFile = '';
  @observable partitionFileContent = '';

  @computed get partitionFileName() {
    return parsePath(this.partitionFile).basename;
  }

  @computed get havePartitionFile() {
    return this.partitionFile !== '';
  }

  @computed get canLoadPartitionFile() {
    return this.alignments.length === 1 && !this.havePartitionFile;
  }

  @action loadPartitionFile = () => {
    ipcRenderer.send(ipc.PARTITION_FILE_SELECT, this.id);
  };

  @action onPartitionSelected = async (event, { id, filePath }) => {
    if (id === this.id) {
      const content = await readFile(filePath, 'utf-8');
      this.partitionFile = filePath;
      this.partitionFileContent = content;
    }
  };

  @action removePartitionFile = () => {
    this.partitionFile = '';
    this.partitionFileContent = '';
  };

  @action
  clearStdout = () => {
    this.stdout = '';
  };

  @action
  clearStderr = () => {
    this.stderr = '';
  };

  @action
  clearConsole = () => {
    this.clearStdout();
    this.clearStderr();
  };

  @action
  clearError = () => {
    this.error = null;
  };

  @action
  reset = () => {
    this.outGroup.reset();
    this.removePartitionFile();
  };

  dispose = () => {
    this.cancel();
    this.unlisten();
  };

  listen = () => {
    this.listenTo(ipc.TREE_SELECTED, this.onTreeSelected);
    this.listenTo(ipc.PARTITION_FILE_SELECTED, this.onPartitionSelected);
    this.listenTo(ipc.ALIGNMENT_SELECTED, this.onAlignmentAdded);
    this.listenTo(ipc.ASTRAL_FILE_SELECTED, this.onAstralFileAdded);
    this.listenTo(ipc.OUTPUT_DIR_SELECTED, this.onOutputDirSelected);
    this.listenTo(ipc.RUN_STDOUT, this.onRunStdout);
    this.listenTo(ipc.RUN_STDERR, this.onRunStderr);
    this.listenTo(ipc.RUN_FINISHED, this.onRunFinished);
    this.listenTo(ipc.RUN_ERROR, this.onRunError);
    this.listenTo(ipc.ASTRAL_SUCCESS, this.onAstralFinished);
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
  onAlignmentAdded = (event, { id, alignments }) => {
    if (id === this.id) {
      this.addAlignments(alignments);
    }
  };

  @action
  onAstralFileAdded = (event, { id, file }) => {
    if (id === this.id) {
      this.addAstralFiles(file);
    }
  };

  @action
  onOutputDirSelected = (event, { id, outputDir }) => {
    if (id === this.id) {
      this.setOutputDir(outputDir);
    }
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
  onAstralFinished = (event, { id, exitCode }) => {
    if (id === this.id) {
      console.log(`Process ${id} finished with exitCode '${exitCode}'`);
      this.resultDir = this.outputDir;
      this.atomFinished.reportChanged();
      this.finished = true;
      this.exitCode = exitCode;
      this.afterRun();
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

  generateReport = ({ maxStdoutLength = 1000 } = {}) => {
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
