import { observable, computed, action, makeObservable, override } from 'mobx';
import { range } from 'd3-array';

import Option from './Option';
import { host } from './host';
import { basename, dir, name } from '../paths';
import * as raxmlSettings from '../../settings/raxml';

/** What the option classes read from the run that owns them */
interface RunOwner {
  binary: { value: string };
  analysis: { value: string };
  analysisOption: { params: string[] };
  startingTree: { notAvailable: boolean; value: string };
  substitutionMatrix: { notGTR: boolean };
  substitutionI: { isSet: boolean };
  substitutionAscertainment: { isSet: boolean };
  finalAlignment: { hasInvariantSites: boolean };
  taxons: string[];
  haveAlignments: boolean;
  dataType: string | undefined;
  usesRaxmlNg: boolean;
  usesModeltestNg: boolean;
  useBackboneConstraint: boolean;
  useMultifurcatingConstraint: boolean;
}

interface BinaryInfo {
  name: string;
  multithreaded?: boolean;
  version: string;
  type: string;
  initial?: boolean;
}

export interface AnalysisChoice {
  title: string;
  value: string;
  params: string[];
  needTree?: boolean;
}

interface Choice<Value> {
  value: Value;
  title: string | number;
}

const raxmlMatrixOptions = raxmlSettings.matrixOptions;
const raxmlRateOptions = raxmlSettings.rateOptions;
const raxmlIOptions = raxmlSettings.iOptions;
const raxmlAscertainmentOptions = raxmlSettings.ascertainmentOptions;

export const MAX_NUM_CPUS = navigator.hardwareConcurrency || 1;

// On Windows 7 (= 6.1) use older versions of RAxML
const [majorVersion, minorVersion] = host.release.split( '.' );
const winBinaries: BinaryInfo[] =
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
const armBinaries: BinaryInfo[] = [
  {
    name: 'modeltest-ng-ARM64',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  },
];
const x64Binaries: BinaryInfo[] = [
  {
    name: 'modeltest-ng',
    multithreaded: true,
    version: '0.1.7',
    type: 'modeltest',
  },
];

const allBinaries: BinaryInfo[] = host.windows
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

export const binaries: BinaryInfo[] = allBinaries.filter( ( { multithreaded } ) =>
  MAX_NUM_CPUS === 1
    ? !multithreaded
    : true,
);

const initialBinaryName = binaries.filter( ( { initial } ) => initial )[0].name;

// Available parameters for different analysis
const params: Record<string, string> = {
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

export const analysisOptions: AnalysisChoice[] = [
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

export const raxmlNgAnalysisOptions: AnalysisChoice[] = [
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

export class Binary extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, initialBinaryName, 'Binary', 'Name of binary' );
    makeObservable( this, {
      version: computed,
      type: computed,
    } );
  }
  options: Choice<string>[] = binaries.map( ( { name } ) => ( { value: name, title: name } ) );
  get version(): string {
    return binaries.filter( ( b ) => b.name === this.value )[0].version;
  }
  get type(): string {
    return binaries.filter( ( b ) => b.name === this.value )[0].type;
  }
}

export class NumThreads extends Option<number, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 2, 'Threads', 'Number of cpu threads' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<number>[] = range( 1, MAX_NUM_CPUS + 1 ).map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable(): boolean {
    return !(
      /PTHREADS/.test( this.run.binary.value ) || this.run.usesModeltestNg
    );
  }
}

export class Analysis extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'ML+rBS', 'Analysis', 'Type of analysis' );
  }
  options: Choice<string>[] = analysisOptions.map( ( { value, title } ) => ( { value, title } ) );
}

export class RaxmlNgAnalysis extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'ML+TBE+con', 'Analysis', 'Type of analysis' );
  }
  options: Choice<string>[] = raxmlNgAnalysisOptions.map( ( { value, title } ) => ( {
    value,
    title,
  } ) );
}

export class NumRuns extends Option<number, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 1, 'Runs', 'Number of runs' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<number>[] = [1, 10, 20, 50, 100, 500].map( ( value ) => ( { value, title: value } ) );
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.runs );
  }
}

export class NumRepetitions extends Option<number | string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 100, 'Reps.', 'Number of repetitions' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<number | string>[] = [
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
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.reps );
  }
}

export class NumRepetitionsNg extends Option<number | string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 100, 'Reps.', 'Number of repetitions' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<number | string>[] = [100, 200, 500, 1000, 10000, 'autoMRE'].map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.repsNg );
  }
}

//TODO: Another branch lengths option for FT? ('compute brL' vs 'BS brL' for the rest)
export class BranchLength extends Option<boolean, RunOwner> {
  constructor( run: RunOwner ) {
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
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.brL );
  }
}

export class SHlike extends Option<boolean, RunOwner> {
  constructor( run: RunOwner ) {
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
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.SHlike );
  }
}

export class CombinedOutput extends Option<boolean, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, false, 'Combined output', 'Concatenate output trees' );
    makeObservable( this, {
      notAvailable: computed,
      isUsed: computed,
    } );
  }
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.combinedOutput );
  }
  get isUsed(): boolean {
    return this.value && !this.notAvailable;
  }
}

export class StartingTree extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'Maximum parsimony', 'Starting tree', '' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<string>[] = ['Maximum parsimony', 'User defined'].map( ( value ) => ( {
    value,
    title: value,
  } ) );
  get notAvailable(): boolean {
    return !this.run.analysisOption.params.includes( params.startingTree );
  }
}

export class OutGroup extends Option<string[], RunOwner> {
  constructor( run: RunOwner ) {
    super( run, ['<none>'], 'Outgroup', '' );
    makeObservable( this, {
      options: computed,
      setValue: override,
      notAvailable: computed,
      cmdValue: computed,
    } );
    this.multiple = true;
  }
  multiple: boolean;
  get options(): Choice<string>[] {
    return ['<none>', ...this.run.taxons].map( ( value ) => ( {
      value,
      title: value,
    } ) );
  }

  setValue( value: string[] ): void {
    if ( this.value.includes( '<none>' ) ) {
      this.value = value.filter( ( v: string ) => v !== '<none>' );
      return;
    }
    if ( !this.value.includes( '<none>' ) && value.includes( '<none>' ) ) {
      this.value = value.filter( ( v: string ) => v === '<none>' );
      return;
    }
    this.value = value;
  }

  get notAvailable(): boolean {
    return (
      !this.run.haveAlignments ||
      !this.run.analysisOption.params.includes( params.outGroup )
    );
  }
  get cmdValue(): string {
    return this.value.includes( '<none>' )
      ? ''
      : this.value.join( ',' );
  }
}

export class SubstitutionMatrix extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'GTR', 'Substitution matrix' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      extraCmdValue: computed,
      notGTR: computed,
    } );
  }
  get options(): Choice<string>[] {
    if ( !this.run.haveAlignments || this.run.dataType === undefined ) {
      return [];
    }
    const modelSettings = ( raxmlMatrixOptions as Record<string, { options: readonly string[] }> )[this.run.dataType];
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
  get notAvailable(): boolean {
    return (
      !this.run.haveAlignments ||
      this.run.dataType === 'binary' ||
      this.run.dataType === 'protein' ||
      this.run.dataType === 'multistate' ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue(): string {
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
  get extraCmdValue(): string {
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
  get notGTR(): boolean {
    return this.value !== 'GTR';
  }
}

export class SubstitutionRate extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'GAMMA', 'Substitution rates' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      isCAT: computed,
    } );
  }
  get options(): Choice<string>[] {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlRateOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable(): boolean {
    return (
      !this.run.haveAlignments ||
      ( ( this.run.dataType === 'dna' ||
        this.run.dataType === 'rna' ||
        this.run.dataType === 'nucleotide' ) &&
        this.run.substitutionMatrix.notGTR ) ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue(): string {
    if ( this.run.substitutionMatrix.notGTR ) {
      return 'GAMMA';
    }
    return this.value;
  }
  get isCAT(): boolean {
    return this.value === 'CAT';
  }
}

export class SubstitutionI extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'none', 'Proportion of invariant sites' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      isSet: computed,
    } );
  }
  get options(): Choice<string>[] {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlIOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable(): boolean {
    return (
      this.run.substitutionAscertainment.isSet ||
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg
    );
  }
  get cmdValue(): string {
    return this.value === 'none'
      ? ''
      : 'I';
  }
  get isSet(): boolean {
    return this.value !== 'none';
  }
}

export class SubstitutionAscertainment extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'none', 'Ascertainment bias correction' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
      extraCmdValue: computed,
      isSet: computed,
    } );
  }
  get options(): Choice<string>[] {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlAscertainmentOptions;
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable(): boolean {
    return (
      !this.run.haveAlignments ||
      this.run.usesRaxmlNg ||
      this.run.dataType === 'mixed' ||
      this.run.finalAlignment.hasInvariantSites ||
      this.run.substitutionI.isSet
    );
  }
  get cmdValue(): string {
    return this.value === 'none'
      ? ''
      : 'ASC_';
  }
  get extraCmdValue(): string {
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
  get isSet(): boolean {
    return this.value !== 'none';
  }
}

export class AAMatrixName extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
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
  options: Choice<string>[] = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(
    ( value ) => ( { value, title: value } ),
  );
  get notAvailable(): boolean {
    return this.run.dataType !== 'protein';
  }
}

export class EstimatedFrequencies extends Option<boolean, RunOwner> {
  constructor( run: RunOwner ) {
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
  get notAvailable(): boolean {
    return this.run.dataType === 'protein' || this.run.usesRaxmlNg;
  }
}

export class BaseFrequencies extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
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
  options: Choice<string>[] = [
    { title: 'From model', value: 'default' },
    { title: 'Empirical', value: 'F' },
    { title: 'Estimated (ML)', value: 'X' },
  ];
  get notAvailable(): boolean {
    return this.run.dataType !== 'protein' || this.run.usesRaxmlNg;
  }
}

export class MultistateModel extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
    super( run, 'GTR', 'Multistate model' );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options: Choice<string>[] = raxmlSettings.kMultistateSubstitutionModelOptions.options.map(
    ( value ) => ( { value, title: value } ),
  );
  get notAvailable(): boolean {
    return this.run.dataType !== 'multistate' || this.run.usesRaxmlNg;
  }
}

class TreeFile extends Option<string, RunOwner> {
  constructor( run: RunOwner ) {
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
  get haveFile(): boolean {
    return !!this.filePath;
  }
  get filename(): string {
    return basename( this.filePath );
  }
  get name(): string {
    return name( this.filePath );
  }
  get dir(): string {
    return dir( this.filePath );
  }
  setFilePath = ( filePath: string ): void => {
    this.filePath = filePath;
  };
  openFolder = async (): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.showItemInFolder( this.filePath );
  };
  openFile = async (): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.openPath( this.filePath );
  };
  remove = (): void => {
    this.setFilePath( '' );
  };
}

export class Tree extends TreeFile {
  constructor( ...args: ConstructorParameters<typeof TreeFile> ) {
    super( ...args );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable(): boolean {
    return !(
      this.run.analysisOption.params.includes( params.tree ) ||
      ( !this.run.startingTree.notAvailable &&
        this.run.startingTree.value === 'User defined' )
    );
  }
}

export class BackboneConstraintTree extends TreeFile {
  constructor( ...args: ConstructorParameters<typeof TreeFile> ) {
    super( ...args );
    makeObservable( this, {
      isSet: computed,
      canConstraint: computed,
      notAvailable: computed,
    } );
  }
  get isSet(): boolean {
    return this.run.useBackboneConstraint && this.haveFile;
  }
  get canConstraint(): boolean {
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
  get notAvailable(): boolean {
    return !this.run.useBackboneConstraint || !this.canConstraint;
  }
}

export class MultifurcatingConstraintTree extends TreeFile {
  constructor( ...args: ConstructorParameters<typeof TreeFile> ) {
    super( ...args );
    makeObservable( this, {
      isSet: computed,
      canConstraint: computed,
      notAvailable: computed,
    } );
  }
  get isSet(): boolean {
    return this.run.useMultifurcatingConstraint && this.haveFile;
  }
  get canConstraint(): boolean {
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
  get notAvailable(): boolean {
    return !this.run.useMultifurcatingConstraint || !this.canConstraint;
  }
}
