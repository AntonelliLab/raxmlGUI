import { observable, observableRef, computed, action, runInAction, createAtom, makeObservable } from 'mobx';
import { promisedComputed } from '../promisedComputed';
import filenamify from 'filenamify';

import Alignment from './Alignment';
import FinalAlignment from './FinalAlignment';
import AstralTree from './AstralTree';
import StoreBase, { runEvents } from './StoreBase';
import { host } from './host';
import { commandArgs, commandText, settingsText } from './command';
import type { CmdArg } from './command';
import {
  binaries,
  analysisOptions,
  raxmlNgAnalysisOptions,
  Binary,
  NumThreads,
  Analysis,
  RaxmlNgAnalysis,
  NumRuns,
  NumRepetitions,
  NumRepetitionsNg,
  BranchLength,
  SHlike,
  CombinedOutput,
  StartingTree,
  OutGroup,
  SubstitutionMatrix,
  SubstitutionRate,
  SubstitutionI,
  SubstitutionAscertainment,
  AAMatrixName,
  EstimatedFrequencies,
  BaseFrequencies,
  MultistateModel,
  Tree,
  BackboneConstraintTree,
  MultifurcatingConstraintTree,
} from './RunOptions';
import type { AnalysisChoice } from './RunOptions';
import type { DataType } from '../../common/typecheckAlignment';
import { basename, join } from '../paths';
import UserFixError from '../../common/errors';
import type { ErrorObject } from 'serialize-error';
import type { AstralSuccessPayload } from '../../main/astral';
import type { StateReport } from '../../main/getActiveState';
import type { RunOutputPayload } from '../../main/processHelpers';
import type { RunFinishedPayload, RunErrorPayload } from '../../main/startRun';

const { windows } = host;

interface RunParent {
  onError: ( error: UserFixError ) => void;
  deleteRun: ( run: Run ) => void;
}

interface FilePathEntry {
  path: string;
}

class Run extends StoreBase {
  parent: RunParent;
  finalAlignment: FinalAlignment;
  outputNamePlaceholder: string;
  modeltestName: string | undefined;
  startToken: object | null | undefined;

  constructor( parent: RunParent, id: number ) {
    super();
    makeObservable( this, {
      analysis: computed,
      analysisOption: computed,
      loadTreeFile: action,
      loadBackboneConstraintFile: action,
      loadMultifurcatingConstraintFile: action,
      disableCheckUndeterminedSequence: observable,
      outputName: observable,
      setOutputName: action,
      outputNameOk: computed,
      outputNameSafe: computed,
      outputNameNotice: computed,
      outputFilenameSafe: computed,
      outputDir: observable,
      setOutputDir: action,
      selectOutputDir: action,
      openOutputDir: action,
      showPartitionFor: observableRef,
      showPartition: action,
      hidePartition: action,
      resultDir: observable,
      resultFilenames: computed,
      haveResult: computed,
      openFile: action,
      haveAlignments: computed,
      hasAstralTree: computed,
      taxons: computed,
      dataType: computed,
      error: observable,
      missing: computed,
      running: observable,
      finished: observable,
      exitCode: observable,
      clearFinished: action,
      ok: computed,
      startDisabled: computed,
      randomSeed: observable,
      seedParsimony: computed,
      seedRapidBootstrap: computed,
      seedBootstrap: computed,
      setRandomSeed: action,
      haveRandomSeed: computed,
      usesRaxmlNg: computed,
      usesModeltestNg: computed,
      inputIsAlignment: computed,
      inputIsTree: computed,
      usesModeltest: computed,
      usesRaxml: computed,
      usesAstral: computed,
      modelTestCanRun: computed,
      modelTestIsRunningOnAlignment: computed,
      cancelModeltestOnAlignment: action,
      args: computed,
      ngSubstitutionModelCmd: computed,
      showModifiedSnack: computed,
      showModifiedDialog: computed,
      modificationMessages: computed,
      converted: computed,
      modified: computed,
      convertedAlignmentFrom: computed,
      clearShowModified: action,
      raxmlSubstitutionModelCmd: computed,
      command: computed,
      settingsFileContent: computed,
      settingsFilePath: computed,
      writeSettings: action,
      startAstral: action,
      start: action,
      cancel: action,
      afterRun: action,
      alignments: observable,
      astralTree: observable,
      code: observable,
      data: observable,
      path: observable,
      stdout: observable,
      stderr: observable,
      useBackboneConstraint: observable,
      useMultifurcatingConstraint: observable,
      needAlignment: computed,
      removeRun: action,
      loadAlignmentFiles: action,
      loadAstralTree: action,
      addAlignments: action,
      addAstralFiles: action,
      removeAlignment: action,
      removeAstralTree: action,
      canLoadAlignment: computed,
      canLoadAstralTree: computed,
      partitionFile: observable,
      partitionFileContent: observable,
      partitionFileName: computed,
      havePartitionFile: computed,
      canLoadPartitionFile: computed,
      loadPartitionFile: action,
      addPartitionFiles: action,
      addTreeFiles: action,
      removePartitionFile: action,
      clearStdout: action,
      clearStderr: action,
      clearConsole: action,
      clearError: action,
      reset: action,
      onRunStdout: action,
      onRunStderr: action,
      onAstralSuccess: action,
      onRunFinished: action,
      onRunError: action,
      onBackboneConstraint: action,
      onMultifurcatingConstraint: action,
    } );
    this.parent = parent;
    this.id = id;
    this.finalAlignment = new FinalAlignment( this );
    this.listen();
    this.outputNamePlaceholder = `${id}`;
    this.atomAfterRun = createAtom( 'AfterRun' );
    this.atomFinished = createAtom( 'finished' );
    this.modeltestName = binaries.filter( ( b ) =>
      b.name.includes( 'modeltest' ),
    )[0]?.name;
  }

  id = 0;

  binary: Binary = new Binary( this );
  numThreads = new NumThreads( this );

  raxmlNgSwitch = <A, B>( raxmlNgParam: A, raxmlParam: B ): A | B => {
    if ( this.usesRaxmlNg ) {
      return raxmlNgParam;
    }
    return raxmlParam;
  };

  get analysis(): RaxmlNgAnalysis | Analysis {
    return this.raxmlNgSwitch( new RaxmlNgAnalysis( this ), new Analysis( this ) );
  }

  get analysisOption(): AnalysisChoice {
    const option = this.raxmlNgSwitch(
      raxmlNgAnalysisOptions.find( ( opt ) => opt.value === this.analysis.value ),
      analysisOptions.find( ( opt ) => opt.value === this.analysis.value ),
    );
    if ( !option ) {
      throw new Error( `No analysis option for analysis '${this.analysis.value}'` );
    }
    return option;
  }

  // Analysis params
  substitutionMatrix: SubstitutionMatrix = new SubstitutionMatrix( this );
  substitutionI: SubstitutionI = new SubstitutionI( this );
  substitutionRate = new SubstitutionRate( this );
  substitutionAscertainment: SubstitutionAscertainment = new SubstitutionAscertainment( this );
  numRuns = new NumRuns( this );
  numRepetitions = new NumRepetitions( this );
  numRepetitionsNg = new NumRepetitionsNg( this );
  branchLength = new BranchLength( this );
  sHlike = new SHlike( this );
  combinedOutput = new CombinedOutput( this );
  outGroup = new OutGroup( this );
  aaMatrixName = new AAMatrixName( this );
  estimatedFrequencies = new EstimatedFrequencies( this );
  baseFrequencies = new BaseFrequencies( this );
  multistateModel = new MultistateModel( this );
  startingTree: StartingTree = new StartingTree( this );

  tree = new Tree( this );
  backboneConstraint = new BackboneConstraintTree( this );
  multifurcatingConstraint = new MultifurcatingConstraintTree( this );

  chooseTree = async ( type: string ): Promise<void> => {
    const { rendererBridge } = window;
    const chosen = await rendererBridge.selectTree( this.id, type );
    if ( !chosen ) {
      return;
    }
    this.addTreeFiles( chosen.type, [{ path: chosen.filePath }] );
  };

  loadTreeFile = (): Promise<void> => this.chooseTree( 'tree' );

  loadBackboneConstraintFile = (): Promise<void> => this.chooseTree( 'backboneConstraint' );

  loadMultifurcatingConstraintFile = (): Promise<void> => this.chooseTree( 'multifurcatingConstraint' );

  disableCheckUndeterminedSequence = true;

  outputName = 'output';
  setOutputName = ( value: string ): void => {
    this.outputName = filenamify( value.replace( /\s+/g, '_' ).trim() );
  };

  atomAfterRun: ReturnType<typeof createAtom>; // Trigger atom when run is finished to re-run outputNameAvailable

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
        resultFilenames: [] as string[],
      };
      const outputNameToCheck = outputName || outputNamePlaceholder;
      const check = atomAfterRun.reportObserved() || outputNameToCheck;
      if ( !check ) {
        return defaultValue;
      }
      const { rendererBridge } = window;
      return rendererBridge.checkOutput( {
        outputDir,
        outputName: outputNameToCheck,
      } );
    },
  );

  get outputNameOk(): boolean {
    return this.outputNameAvailable.get().ok;
  }

  get outputNameSafe(): string {
    return (
      this.outputNameAvailable.get().outputNameUnused ||
      this.outputNamePlaceholder
    );
  }

  get outputNameNotice(): string {
    return this.outputNameOk
      ? ''
      : `Output with that id already exists. New run will use output id '${this.outputNameSafe}'`;
  }

  get outputFilenameSafe(): string {
    return `${this.outputNameSafe}.tre`;
  }

  outputDir = '';
  setOutputDir = ( dir: string ): void => {
    this.outputDir = dir;
  };
  selectOutputDir = async (): Promise<void> => {
    const { rendererBridge } = window;
    const outputDir = await rendererBridge.selectOutputDir( this.id );
    if ( !outputDir ) {
      return;
    }
    this.setOutputDir( outputDir );
  };

  openOutputDir = async (): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.openPath( this.outputDir );
  };

  showPartitionFor: Alignment | null = null;
  showPartition = ( alignment: Alignment | null ): void => {
    this.showPartitionFor = alignment;
  };
  hidePartition = (): void => {
    this.showPartition( null );
  };

  // Result
  resultDir = '';
  get resultFilenames(): string[] {
    return this.outputNameAvailable.get().resultFilenames || [];
  }

  get haveResult(): boolean {
    return this.resultFilenames.length > 0 && this.resultDir === this.outputDir;
  }

  openFile = async ( filePath: string ): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.openPath( filePath );
  };

  get haveAlignments(): boolean {
    return this.alignments.length > 0;
  }

  get hasAstralTree(): boolean {
    return !!this.astralTree;
  }

  get taxons(): string[] {
    return this.haveAlignments
      ? this.alignments[0].taxons
      : [];
  }

  get dataType(): DataType | undefined {
    return this.finalAlignment.dataType;
  }

  error: ErrorObject | null = null;

  get missing(): '' | 'Missing tree, please load one.' {
    if ( !this.tree.notAvailable && !this.tree.filePath ) {
      return 'Missing tree, please load one.';
    }
    return '';
  }

  running = false;
  finished = false;
  exitCode: RunFinishedPayload['exitCode'] = 0;
  clearFinished = (): void => {
    this.finished = false;
    this.exitCode = 0;
  };
  atomFinished: ReturnType<typeof createAtom>;

  get ok(): boolean {
    return !this.error && !this.missing;
  }

  get startDisabled(): boolean {
    return (
      ( this.alignments.length === 0 && !this.hasAstralTree ) ||
      !this.ok ||
      this.running ||
      !this.finalAlignment.partition.isComplete ||
      ( this.usesModeltestNg && !this.modelTestCanRun ) ||
      ( this.usesModeltestNg && this.alignments.length > 1 ) ||
      this.modelTestIsRunningOnAlignment
    );
  }

  randomSeed = Math.floor( 1000000 * Math.random() );
  get seedParsimony(): number {
    return this.randomSeed;
  }
  get seedRapidBootstrap(): number {
    return this.randomSeed;
  }
  get seedBootstrap(): number {
    return this.randomSeed;
  }

  setRandomSeed = ( value: string | number ): void => {
    const v = Number( value );
    if ( !Number.isNaN( v ) && v !== 0 && v < 1e6 ) {
      this.randomSeed = v;
    }
  };

  get haveRandomSeed(): boolean {
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
    return analysisWithSeed.includes( this.analysis.value );
  }

  get usesRaxmlNg(): boolean {
    return this.binary.value.includes( 'raxml-ng' );
  }

  get usesModeltestNg(): boolean {
    return this.binary.value.includes( 'modeltest-ng' );
  }

  get inputIsAlignment(): boolean {
    return this.usesModeltest || this.usesRaxml;
  }

  get inputIsTree(): boolean {
    return this.usesAstral;
  }

  get usesModeltest(): boolean {
    return this.binary.type === 'modeltest';
  }

  get usesRaxml(): boolean {
    return this.binary.type === 'raxml';
  }

  get usesAstral(): boolean {
    return this.binary.type === 'astral';
  }

  get modelTestCanRun(): boolean {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  get modelTestIsRunningOnAlignment(): boolean {
    const running = this.alignments.some(
      ( alignment ) => alignment.modeltestLoading,
    );
    return running;
  }

  cancelModeltestOnAlignment = (): void => {
    this.alignments.forEach( ( alignment ) => alignment.cancelModelTest() );
  };

  get args(): CmdArg[][] {
    return commandArgs( this, { windows } );
  }

  get ngSubstitutionModelCmd(): string {
    return this.haveAlignments
      ? this.alignments[0].ngSubstitutionModelCmd
      : '';
  }

  get showModifiedSnack(): boolean {
    const shouldShow = this.alignments
      .map( ( a ) => a.showModifiedSnack )
      .some( ( e ) => e );
    return this.haveAlignments && shouldShow;
  }

  get showModifiedDialog(): boolean {
    const shouldShow = this.alignments
      .map( ( a ) => a.showModifiedDialog )
      .some( ( e ) => e );
    return this.haveAlignments && shouldShow;
  }

  get modificationMessages(): string[] {
    const messages: string[] = [];
    this.alignments.forEach( ( a ) => {
      messages.push( `${a.name}:\n` );
      a.modificationMessages.forEach( ( b ) => {
        messages.push( `${b}\n` );
      } );
    } );
    return messages;
  }

  get converted(): boolean {
    const converted = this.alignments.map( ( a ) => a.converted ).some( ( e ) => e );
    return this.haveAlignments && converted;
  }

  get modified(): boolean {
    const modified = this.alignments.map( ( a ) => a.modified ).some( ( e ) => e );
    return this.haveAlignments && modified;
  }

  get convertedAlignmentFrom(): string | null {
    if ( !this.haveAlignments ) {
      return null;
    }
    const convertedAlignments = this.alignments.filter( ( a ) => a.converted );
    return convertedAlignments[0].convertedFrom ?? null;
  }

  clearShowModified = (): void => {
    for ( const alignment of this.alignments ) {
      alignment.clearModified();
    }
  };

  get raxmlSubstitutionModelCmd(): string {
    let model =
      this.substitutionAscertainment.cmdValue +
      this.substitutionMatrix.cmdValue +
      this.substitutionRate.cmdValue +
      this.substitutionI.cmdValue;
    if ( this.dataType === 'protein' ) {
      model += this.alignments[0].aaMatrixName;
      const { value: suffix } = this.baseFrequencies;
      model += suffix === 'default'
        ? ''
        : suffix;
    } else {
      if ( this.estimatedFrequencies.value ) {
        model += 'X';
      }
    }
    return model;
  }

  get command(): string {
    return commandText( this.binary.value, this.args, this.usesAstral );
  }

  get settingsFileContent(): string {
    return settingsText( {
      appVersion: this.version,
      analysisTitle: this.analysisOption.title,
      binary: this.binary,
      outputDir: this.outputDir,
      args: this.args,
    } );
  }

  get settingsFilePath(): string {
    return join(
      `${this.outputDir}`,
      `RAxML_GUI_Settings_${this.outputNameSafe}.txt`,
    );
  }

  writeSettings = async (): Promise<void> => {
    try {
      console.log( `Writing settings to ${this.settingsFilePath}...` );
      const { rendererBridge } = window;
      await rendererBridge.writeFile( this.settingsFilePath, this.settingsFileContent );
    } catch ( err: unknown ) {
      console.error( 'Error writing settings:', err );
      throw err;
    }
  };

  startAstral = async (): Promise<void> => {
    const { id, binary, args } = this;
    console.log( `Start astral run ${id}` );
    this.running = true;
    const { rendererBridge } = window;
    await rendererBridge.startAstral( {
      id,
      binaryName: binary.value,
      // @ts-expect-error the args getter is typed for every binary; ASTRAL args are all strings
      args,
    } );
  };

  start = async (): Promise<void> => {
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
    if ( this.usesAstral ) {
      return this.startAstral();
    }

    // Less than 4 sequences and RAxML would error out
    if ( this.finalAlignment.numSequences <= 3 ) {
      this.parent.onError(
        new UserFixError(
          'To start a run with RAxML the final alignment needs to have at least four sequences.',
        ),
      );
      return;
    }

    this.running = true;
    const startToken = {};
    this.startToken = startToken;
    if ( this.outputName !== this.outputNameSafe ) {
      this.outputName = this.outputNameSafe;
    }

    if ( this.finalAlignment.numAlignments > 1 ) {
      await this.finalAlignment.writeConcatenatedAlignmentAndPartition();
    } else if ( !this.finalAlignment.partition.isDefault ) {
      await this.finalAlignment.writePartition();
    }
    await this.writeSettings();
    if ( this.startToken !== startToken ) {
      return;
    }
    console.log( `Start run ${id} with args ${args}` );
    const { rendererBridge } = window;
    await rendererBridge.startRun( {
      id,
      // @ts-expect-error args carry seed and thread numbers the payload type calls strings
      args,
      binaryName: binary.value,
      outputDir,
      outputFilename,
      outputName,
      combinedOutput: combinedOutput.isUsed,
      usesRaxmlNg,
      usesModeltestNg,
      inputPath: finalAlignment.path,
    } );
  };

  cancel = (): void => {
    this.startToken = null;
    const { rendererBridge } = window;
    rendererBridge.cancelRun( this.id );
    this.afterRun();
  };

  afterRun = (): void => {
    this.running = false;
    this.atomAfterRun.reportChanged();
  };

  alignments: Alignment[] = [];
  astralTree: AstralTree | null | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types -- the annotation keeps the type undefined, not implicit any
  code: undefined = undefined;
  data = '';
  path: string | undefined = undefined;
  stdout = '';
  stderr = '';

  useBackboneConstraint = false;
  useMultifurcatingConstraint = false;

  get needAlignment(): boolean {
    return true;
  }

  removeRun = (): void => {
    this.parent.deleteRun( this );
  };

  loadAlignmentFiles = async (): Promise<void> => {
    const { rendererBridge } = window;
    const alignments = await rendererBridge.selectAlignment( this.id );
    if ( !alignments ) {
      return;
    }
    this.addAlignments( alignments );
  };

  loadAstralTree = async (): Promise<void> => {
    const { rendererBridge } = window;
    const file = await rendererBridge.selectAstralFile( this.id );
    if ( !file ) {
      return;
    }
    this.addAstralFiles( file );
  };

  haveAlignment = ( id: string ): boolean => {
    // TODO: Input.js queries without id, doe it work as expected? Later queries with path instead of id
    return this.alignments.findIndex( ( alignment ) => alignment.id === id ) >= 0;
  };

  addAlignments = ( alignments: FilePathEntry[] ): void => {
    alignments.forEach( ( { path } ) => {
      if ( !this.haveAlignment( path ) ) {
        this.alignments.push( new Alignment( this, path ) );
        if ( this.alignments.length === 1 ) {
          this.setOutputName( this.alignments[0].name );
          if ( !this.outputDir ) {
            this.setOutputDir( this.alignments[0].dir );
          }
        }
      }
    } );
  };

  addAstralFiles = ( { path }: FilePathEntry ): void => {
    if ( !this.hasAstralTree ) {
      this.astralTree = new AstralTree( this, path );
      this.setOutputName( this.astralTree.name );
      if ( !this.outputDir ) {
        this.setOutputDir( this.astralTree.dir );
      }
    }
  };

  removeAlignment = ( alignment: Alignment ): void => {
    const oldDataType = this.dataType;
    const index = this.alignments.indexOf( alignment );
    if ( index >= 0 ) {
      this.alignments.splice( index, 1 );
    }
    if ( this.haveAlignments ) {
      // this.dataType is computed automatically with the reduced set, reset to default if changed (from mixed or multistate)
      if ( this.dataType !== oldDataType ) {
        // This parameter is deleted, but there seems to be no need for updating other params
        // this.substitutionModel.value = raxmlModelOptions[this.dataType].default;
      }
    } else {
      this.reset();
    }
  };

  removeAstralTree = (): void => {
    this.astralTree = null;
  };

  get canLoadAlignment(): boolean {
    return (
      ( this.binary.type === 'raxml' || this.binary.type === 'modeltest' ) &&
      !this.havePartitionFile
    );
  }

  get canLoadAstralTree(): boolean {
    return this.usesAstral && !this.hasAstralTree;
  }

  partitionFile = '';
  partitionFileContent = '';

  get partitionFileName(): string {
    return basename( this.partitionFile );
  }

  get havePartitionFile(): boolean {
    return this.partitionFile !== '';
  }

  get canLoadPartitionFile(): boolean {
    return this.alignments.length === 1 && !this.havePartitionFile;
  }

  loadPartitionFile = async (): Promise<void> => {
    const { rendererBridge } = window;
    const filePath = await rendererBridge.selectPartitionFile( this.id );
    if ( !filePath ) {
      return;
    }
    await this.addPartitionFiles( [{ path: filePath }] );
  };

  addPartitionFiles = async ( files: FilePathEntry[] ): Promise<void> => {
    if ( !files.length ) {
      return;
    }
    const { path } = files[0];
    const { rendererBridge } = window;
    const content = await rendererBridge.readFile( path );
    runInAction( () => {
      this.partitionFile = path;
      this.partitionFileContent = content;
    } );
  };

  addTreeFiles = ( type: string, files: FilePathEntry[] ): void => {
    if ( !files.length ) {
      return;
    }
    const { path } = files[0];
    switch ( type ) {
      case 'tree':
        this.tree.setFilePath( path );
        break;
      case 'backboneConstraint':
        this.backboneConstraint.setFilePath( path );
        break;
      case 'multifurcatingConstraint':
        this.multifurcatingConstraint.setFilePath( path );
        break;
      default:
        break;
    }
  };

  removePartitionFile = (): void => {
    this.partitionFile = '';
    this.partitionFileContent = '';
  };

  clearStdout = (): void => {
    this.stdout = '';
  };

  clearStderr = (): void => {
    this.stderr = '';
  };

  clearConsole = (): void => {
    this.clearStdout();
    this.clearStderr();
  };

  clearError = (): void => {
    this.error = null;
  };

  reset = (): void => {
    this.outGroup.reset();
    this.removePartitionFile();
  };

  dispose = (): void => {
    this.cancel();
    this.unlisten();
  };

  listen = (): void => {
    this.subscribe( runEvents.onRunStdout, this.onRunStdout );
    this.subscribe( runEvents.onRunStderr, this.onRunStderr );
    this.subscribe( runEvents.onRunFinished, this.onRunFinished );
    this.subscribe( runEvents.onRunError, this.onRunError );
    this.subscribe( runEvents.onAstralSuccess, this.onAstralSuccess );
  };

  // -----------------------------------------------------------
  // Listeners
  // -----------------------------------------------------------

  onRunStdout = ( { id, content }: RunOutputPayload ): void => {
    if ( id === this.id ) {
      this.stdout += content;
    }
  };

  onRunStderr = ( { id, content }: RunOutputPayload ): void => {
    if ( id === this.id ) {
      this.stderr += content;
    }
  };

  onAstralSuccess = ( { id, exitCode }: AstralSuccessPayload ): void => {
    if ( id === this.id ) {
      console.log( `Process ${id} finished with exitCode '${exitCode}'` );
      this.resultDir = this.outputDir;
      this.atomFinished.reportChanged();
      this.finished = true;
      this.exitCode = exitCode;
      this.afterRun();
    }
  };

  onRunFinished = ( { id, resultDir, resultFilenames, exitCode }: RunFinishedPayload ): void => {
    if ( id === this.id ) {
      console.log(
        `Process ${id} finished with exitCode '${exitCode}' and result filenames ${resultFilenames} in dir ${resultDir}.`,
      );
      this.resultDir = resultDir;
      this.atomFinished.reportChanged();
      this.finished = true;
      this.exitCode = exitCode;
      this.afterRun();
    }
  };

  onRunError = ( { id, error }: RunErrorPayload ): void => {
    if ( id === this.id ) {
      console.log( `Process ${id} finished with error:`, error );
      this.error = error;
      this.afterRun();
    }
  };

  onBackboneConstraint = ( _event: unknown, _params: unknown ): void => {
    this.useBackboneConstraint = !this.useBackboneConstraint;
  };

  onMultifurcatingConstraint = ( _event: unknown, _params: unknown ): void => {
    this.useMultifurcatingConstraint = !this.useMultifurcatingConstraint;
  };

  generateReport = ( { maxStdoutLength = 1000 }: { maxStdoutLength?: number } = {} ): StateReport => {
    const tail = ( text: string ): string => ( text.length > maxStdoutLength
      ? `[${text.length - maxStdoutLength} more characters]...${text.slice( -maxStdoutLength )}`
      : text );
    return { command: this.command, stdout: tail( this.stdout ), stderr: tail( this.stderr ) };
  };
}

export default Run;
