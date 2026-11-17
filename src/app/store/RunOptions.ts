import { observable, computed, action, makeObservable, override } from 'mobx';
import { range } from 'd3-array';

import Option from './Option';
import { host } from './host';
import { basename, dir, name } from '../paths';
import * as raxmlSettings from '../../settings/raxml';

const raxmlMatrixOptions = raxmlSettings.matrixOptions;
const raxmlRateOptions = raxmlSettings.rateOptions;
const raxmlIOptions = raxmlSettings.iOptions;
const raxmlAscertainmentOptions = raxmlSettings.ascertainmentOptions;

export const MAX_NUM_CPUS = navigator.hardwareConcurrency || 1;

// On Windows 7 (= 6.1) use older versions of RAxML
const [majorVersion, minorVersion] = host.release.split( '.' );
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

const likelyARM =
  host.arch.includes( 'arm64' ) || host.cpuModel.includes( 'Apple' );
const armBinaries = [
  {
    name: 'modeltest-ng-ARM64',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  },
];
const x64Binaries = [
  {
    name: 'modeltest-ng',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  },
];

const allBinaries = host.windows
  ? winBinaries
  : [
    ...( !likelyARM
      ? x64Binaries
      : armBinaries ),
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

export const binaries = allBinaries.filter( ( { multithreaded } ) =>
  MAX_NUM_CPUS === 1
    ? !multithreaded
    : true,
);

const initialBinaryName = binaries.filter( ( { initial } ) => initial )[0].name;

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

export const analysisOptions = [
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

export const raxmlNgAnalysisOptions = [
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

export class Binary extends Option {
  constructor( run ) {
    super( run, initialBinaryName, 'Binary', 'Name of binary' );
    makeObservable( this, {
      version: computed,
      type: computed,
    } );
  }
  options = binaries.map( ( { name } ) => ( { value: name, title: name } ) );
  get version() {
    return binaries.filter( ( b ) => b.name === this.value )[0].version;
  }
  get type() {
    return binaries.filter( ( b ) => b.name === this.value )[0].type;
  }
}

export class NumThreads extends Option {
  constructor( run ) {
    super( run, 2, 'Threads', 'Number of cpu threads' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = range( 1, MAX_NUM_CPUS + 1 ).map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable() {
    return !(
      /PTHREADS/.test( this.run.binary.value ) || this.run.usesModeltestNg
    );
  }
}

export class Analysis extends Option {
  constructor( run ) {
    super( run, 'ML+rBS', 'Analysis', 'Type of analysis' );
  }
  options = analysisOptions.map( ( { value, title } ) => ( { value, title } ) );
}

export class RaxmlNgAnalysis extends Option {
  constructor( run ) {
    super( run, 'ML+TBE+con', 'Analysis', 'Type of analysis' );
  }
  options = raxmlNgAnalysisOptions.map( ( { value, title } ) => ( {
    value,
    title,
  } ) );
}

export class NumRuns extends Option {
  constructor( run ) {
    super( run, 1, 'Runs', 'Number of runs' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = [1, 10, 20, 50, 100, 500].map( ( value ) => ( { value, title: value } ) );
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.runs );
  }
}

export class NumRepetitions extends Option {
  constructor( run ) {
    super( run, 100, 'Reps.', 'Number of repetitions' );
    makeObservable( this, {
      notAvailable: computed,
    } );
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
  ].map( ( value ) => ( { value, title: value } ) );
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.reps );
  }
}

export class NumRepetitionsNg extends Option {
  constructor( run ) {
    super( run, 100, 'Reps.', 'Number of repetitions' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = [100, 200, 500, 1000, 10000, 'autoMRE'].map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.repsNg );
  }
}

//TODO: Another branch lengths option for FT? ('compute brL' vs 'BS brL' for the rest)
export class BranchLength extends Option {
  constructor( run ) {
    super(
      run,
      false,
      'BS brL',
      'Compute branch lengths',
      'Optimize model parameters and branch lengths for the given input tree',
    );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.brL );
  }
}

export class SHlike extends Option {
  constructor( run ) {
    super(
      run,
      false,
      'SH-like',
      'Compute log-likelihood test',
      'Shimodaira-Hasegawa-like procedure',
    );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.SHlike );
  }
}

export class CombinedOutput extends Option {
  constructor( run ) {
    super( run, false, 'Combined output', 'Concatenate output trees' );
    makeObservable( this, {
      notAvailable: computed,
      isUsed: computed,
    } );
  }
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.combinedOutput );
  }
  get isUsed() {
    return this.value && !this.notAvailable;
  }
}

export class StartingTree extends Option {
  constructor( run ) {
    super( run, 'Maximum parsimony', 'Starting tree', '' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = ['Maximum parsimony', 'User defined'].map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable() {
    return !this.run.analysisOption.params.includes( params.startingTree );
  }
}

export class OutGroup extends Option {
  constructor( run ) {
    super( run, ['<none>'], 'Outgroup', '' );
    makeObservable( this, {
      options: computed,
      setValue: override,
      notAvailable: computed,
      cmdValue: computed,
    } );
    this.multiple = true;
  }
  get options() {
    return ['<none>', ...this.run.taxons].map( ( value ) => ( {
      value,
      title: value,
    } ) );
  }

  setValue( value ) {
    if ( this.value.includes( '<none>' ) ) {
      this.value = value.filter( ( v ) => v !== '<none>' );
      return;
    }
    if ( !this.value.includes( '<none>' ) && value.includes( '<none>' ) ) {
      this.value = value.filter( ( v ) => v === '<none>' );
      return;
    }
    this.value = value;
  }

  get notAvailable() {
    return (
      !this.run.haveAlignments ||
      !this.run.analysisOption.params.includes( params.outGroup )
    );
  }
  get cmdValue() {
    return this.value.includes( '<none>' )
      ? ''
      : this.value.join( ',' );
  }
}

export class SubstitutionMatrix extends Option {
  constructor( run ) {
    super( run, 'GTR', 'Substitution matrix' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      extraCmdValue: computed,
      notGTR: computed,
    } );
  }
  get options() {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlMatrixOptions[this.run.dataType];
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( {
      value,
      title: value === 'GTR'
        ? value
        : `${value} + GAMMA`,
    } ) );
  }
  get notAvailable() {
    return (
      !this.run.haveAlignments ||
      this.run.dataType === 'binary' ||
      this.run.dataType === 'protein' ||
      this.run.dataType === 'multistate' ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue() {
    if ( this.run.dataType === 'binary' ) {
      return 'BIN';
    }
    if ( this.run.dataType === 'protein' ) {
      return 'PROT';
    }
    if ( this.run.dataType === 'multistate' ) {
      return 'MULTI';
    }
    if ( this.value === 'JC' || this.value === 'K80' || this.value === 'HKY' ) {
      return 'GTR';
    }
    return this.value;
  }
  get extraCmdValue() {
    switch ( this.value ) {
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
  get notGTR() {
    return this.value !== 'GTR';
  }
}

export class SubstitutionRate extends Option {
  constructor( run ) {
    super( run, 'GAMMA', 'Substitution rates' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      isCAT: computed,
    } );
  }
  get options() {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlRateOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable() {
    return (
      !this.run.haveAlignments ||
      ( ( this.run.dataType === 'dna' ||
        this.run.dataType === 'rna' ||
        this.run.dataType === 'nucleotide' ) &&
        this.run.substitutionMatrix.notGTR ) ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue() {
    if ( this.run.substitutionMatrix.notGTR ) {
      return 'GAMMA';
    }
    return this.value;
  }
  get isCAT() {
    return this.value === 'CAT';
  }
}

export class SubstitutionI extends Option {
  constructor( run ) {
    super( run, 'none', 'Proportion of invariant sites' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      isSet: computed,
    } );
  }
  get options() {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlIOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable() {
    return (
      this.run.substitutionAscertainment.isSet ||
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue() {
    return this.value === 'none'
      ? ''
      : 'I';
  }
  get isSet() {
    return this.value !== 'none';
  }
}

export class SubstitutionAscertainment extends Option {
  constructor( run ) {
    super( run, 'none', 'Ascertainment bias correction' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      extraCmdValue: computed,
      isSet: computed,
    } );
  }
  get options() {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlAscertainmentOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable() {
    return (
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg ||
      this.run.dataType === 'mixed' ||
      this.run.finalAlignment.hasInvariantSites ||
      this.run.substitutionI.isSet
    );
  }
  get cmdValue() {
    return this.value === 'none'
      ? ''
      : 'ASC_';
  }
  get extraCmdValue() {
    switch ( this.value ) {
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
  get isSet() {
    return this.value !== 'none';
  }
}

export class AAMatrixName extends Option {
  constructor( run ) {
    super(
      run,
      'BLOSUM62',
      'Matrix name',
      'Amino Acid Substitution Matrix name',
    );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(
    ( value ) => ( { value, title: value } ),
  );
  get notAvailable() {
    return this.run.dataType !== 'protein';
  }
}

export class EstimatedFrequencies extends Option {
  constructor( run ) {
    super(
      run,
      false,
      'ML Freq.',
      'Estimated base frequencies',
      'Use estimated base frequencies instead of empirical.',
    );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable() {
    return this.run.dataType === 'protein' || this.run.usesRaxmlNg;
  }
}

export class BaseFrequencies extends Option {
  constructor( run ) {
    super(
      run,
      'default',
      'Base frequencies',
      'Empirical, ML estimated or model based base frequencies',
    );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = [
    { title: 'From model', value: 'default' },
    { title: 'Empirical', value: 'F' },
    { title: 'Estimated (ML)', value: 'X' },
  ];
  get notAvailable() {
    return this.run.dataType !== 'protein' || this.run.usesRaxmlNg;
  }
}

export class MultistateModel extends Option {
  constructor( run ) {
    super( run, 'GTR', 'Multistate model' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = raxmlSettings.kMultistateSubstitutionModelOptions.options.map(
    ( value ) => ( { value, title: value } ),
  );
  get notAvailable() {
    return this.run.dataType !== 'multistate' || this.run.usesRaxmlNg;
  }
}

class TreeFile extends Option {
  constructor( run ) {
    super( run, '', 'Tree', '' );
    makeObservable( this, {
      filePath: observable,
      haveFile: computed,
      filename: computed,
      name: computed,
      dir: computed,
      setFilePath: action,
      openFolder: action,
      openFile: action,
      remove: action,
    } );
  }
  filePath = '';
  get haveFile() {
    return !!this.filePath;
  }
  get filename() {
    return basename( this.filePath );
  }
  get name() {
    return name( this.filePath );
  }
  get dir() {
    return dir( this.filePath );
  }
  setFilePath = ( filePath ) => {
    this.filePath = filePath;
  };
  openFolder = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.showItemInFolder( this.filePath );
  };
  openFile = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( this.filePath );
  };
  remove = () => {
    this.setFilePath( '' );
  };
}

export class Tree extends TreeFile {
  constructor( ...args ) {
    super( ...args );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable() {
    return !(
      this.run.analysisOption.params.includes( params.tree ) ||
      ( !this.run.startingTree.notAvailable &&
        this.run.startingTree.value === 'User defined' )
    );
  }
}

export class BackboneConstraintTree extends TreeFile {
  constructor( ...args ) {
    super( ...args );
    makeObservable( this, {
      isSet: computed,
      canConstraint: computed,
      notAvailable: computed,
    } );
  }
  get isSet() {
    return this.run.useBackboneConstraint && this.haveFile;
  }
  get canConstraint() {
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
    return analysisWithConstraint.includes( this.run.analysis.value );
  }
  get notAvailable() {
    return !this.run.useBackboneConstraint || !this.canConstraint;
  }
}

export class MultifurcatingConstraintTree extends TreeFile {
  constructor( ...args ) {
    super( ...args );
    makeObservable( this, {
      isSet: computed,
      canConstraint: computed,
      notAvailable: computed,
    } );
  }
  get isSet() {
    return this.run.useMultifurcatingConstraint && this.haveFile;
  }
  get canConstraint() {
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
    return analysisWithConstraint.includes( this.run.analysis.value );
  }
  get notAvailable() {
    return !this.run.useMultifurcatingConstraint || !this.canConstraint;
  }
}
