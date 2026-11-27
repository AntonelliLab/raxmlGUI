import { observable, computed, action, runInAction, makeObservable } from 'mobx';

import * as raxmlSettings from '../../settings/raxml';
import * as raxmlNgSettings from '../../settings/raxmlng';
import Partition from './Partition';
import InputFile from './InputFile';
import {
  RaxmlNgAlignmentSubstitutionModel,
  RaxmlNgModelF,
  RaxmlNgModelI,
  RaxmlNgModelG,
  RaxmlNgModelASC,
  MultistateNumber,
} from './AlignmentOptions';
import { runEvents } from './StoreBase';
import { getFinalDataType } from '../../common/typecheckAlignment';
import UserFixError, { restoreUserFixError } from '../../common/errors';
import { host } from './host';
import type { DataType } from '../../common/typecheckAlignment';
import type { AlignmentSequence } from '../../main/parseAlignment';
import type { ModelSelectionResult, ModelSelectionSuccessPayload, ModelSelectionFailurePayload } from '../../main/modelSelection';
import type { RunOutputPayload } from '../../main/processHelpers';

const raxmlMatrixOptions = raxmlSettings.matrixOptions as Record<string, { default: string }>;
const raxmlNgModelOptions = raxmlNgSettings.modelOptions as Record<string, { default: string }>;

interface SettableOption<Value> {
  value: Value;
  setValue: ( value: Value ) => void;
}

interface AlignmentOwner {
  id: number;
  haveAlignments: boolean;
  usesRaxmlNg: boolean;
  showPartitionFor: Alignment | null;
  showPartition: ( alignment: Alignment | null ) => void;
  parent: { onError: ( error: UserFixError ) => void };
  outputDir: string;
  numThreads: { value: number };
  modeltestName: string | undefined;
  baseFrequencies: SettableOption<string>;
  estimatedFrequencies: SettableOption<boolean>;
  substitutionAscertainment: SettableOption<string>;
  substitutionI: SettableOption<string>;
  substitutionRate: SettableOption<string>;
  substitutionMatrix: SettableOption<string>;
  alignments: Alignment[];
  dataType: string | undefined;
  error: unknown;
  afterRun: () => void;
  removeAlignment: ( alignment: Alignment ) => void;
  stdout: string;
  stderr: string;
}

interface ModelExtra {
  label: string;
  options: readonly string[];
  value: string;
  onChange: ( value: string ) => void;
  notAvailable: boolean;
  hoverInfo: string;
  error: unknown;
}

// Merged, not class fields: assigned later, so no own property at construction.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- deliberate merge, see above
interface Alignment {
  numSequencesParsed: number;
  model: string;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- the class half of the merge above
class Alignment extends InputFile<AlignmentOwner> {
  substitutionModel: RaxmlNgAlignmentSubstitutionModel;
  multistateNumber: MultistateNumber;
  ngStationaryFrequencies: RaxmlNgModelF;
  ngInvariantSites: RaxmlNgModelI;
  ngRateHeterogeneity: RaxmlNgModelG;
  ngAscertainmentBias: RaxmlNgModelASC;
  partition: Partition;
  modeltestDisabled: boolean;

  constructor( run: AlignmentOwner, path: string ) {
    super( run, path );
    makeObservable( this, {
      error: observable,
      dataType: observable,
      aaMatrixName: observable,
      size: observable,
      fileFormat: observable,
      convertedFrom: observable,
      converted: observable,
      modified: observable,
      modificationMessages: observable,
      showModifiedSnack: observable,
      showModifiedDialog: observable,
      length: observable,
      numSequences: observable,
      sequences: observable,
      hasInvariantSites: observable,
      parsingComplete: observable,
      typecheckingComplete: observable,
      loading: observable,
      checkRunComplete: observable,
      checkRunData: observable,
      checkRunSuccess: observable,
      partitionText: observable,
      modeltestLoading: observable,
      taxons: computed,
      showPartition: computed,
      partitionType: computed,
      partitionFileContent: computed,
      ngSubstitutionModelCmd: computed,
      status: computed,
      modelExtra: computed,
      modelTestCanRun: computed,
      setShowPartition: action,
      hidePartition: action,
      setPartitionText: action,
      runModelTest: action,
      cancelModelTest: action,
      setModelFromString: action,
      onModelSelectionSuccess: action,
      onModelSelectionFailure: action,
      clearModified: action,
      dispose: action,
      remove: action,
      onChangeModel: action,
      onChangeAAMatrixName: action,
      onRunStdout: action,
      onRunStderr: action,
    } );
    this.substitutionModel = new RaxmlNgAlignmentSubstitutionModel( this );
    this.multistateNumber = new MultistateNumber( this );
    this.ngStationaryFrequencies = new RaxmlNgModelF( this );
    this.ngInvariantSites = new RaxmlNgModelI( this );
    this.ngRateHeterogeneity = new RaxmlNgModelG( this );
    this.ngAscertainmentBias = new RaxmlNgModelASC( this );
    this.partition = new Partition( this );

    const [majorVersion, minorVersion] = host.release.split( '.' );
    this.modeltestDisabled =
      host.windows && majorVersion === '6' && minorVersion === '1';

    this.listen();
  }

  error: unknown = null;

  dataType: DataType | undefined = undefined;
  aaMatrixName: string =
    raxmlSettings.aminoAcidSubstitutionMatrixOptions.default;

  size = 0;
  fileFormat: string | undefined = undefined;
  convertedFrom: string | undefined = undefined;
  converted = false;
  modified = false;
  modificationMessages: string[] = [];
  showModifiedSnack = false;
  showModifiedDialog = false;
  length = 0;
  numSequences = 0;
  sequences: AlignmentSequence[] = [];
  hasInvariantSites = false;

  get taxons(): string[] {
    return this.sequences.map( ( seq ) => seq.taxon );
  }

  parsingComplete = false;
  typecheckingComplete = false;
  loading = true;

  checkRunComplete = false;
  checkRunData = '';
  checkRunSuccess = false;

  // Partition stuff
  get showPartition(): boolean {
    return this.run.showPartitionFor === this;
  }

  setShowPartition = ( value = true ): void => {
    this.run.showPartition( value
      ? this
      : null );
  };

  hidePartition = (): void => {
    this.setShowPartition( false );
  };

  setPartitionText = ( value: string ): void => {
    this.partitionText = value;
  };

  partitionText = '';

  get partitionType(): string {
    if ( this.run.usesRaxmlNg ) {
      return this.ngSubstitutionModelCmd;
    }
    switch ( this.dataType ) {
      // @ts-expect-error The parser never sets 'dna'; dead case kept, see #269.
      case 'dna':
      case 'nucleotide':
        return 'DNA';
      case 'protein':
        return this.aaMatrixName;
      case 'binary':
        return 'BIN';
      case 'multistate':
        return 'MULTI';
      default:
        // '' until the alignment is parsed.
        return this.dataType ?? '';
    }
  }

  get partitionFileContent(): string {
    /*
      DNA, gene1 = 1-3676
      BIN, morph = 3677-3851
    */
    let partitionFileText = '';
    const site = 1;
    const index = 0;
    const total = this.length;
    const name = `${this.dataType}_${index}`;
    partitionFileText += `${this.partitionType}, ${name} = ${site}-${total}\n`;
    // site += alignment.length;
    // return { partitionType, dataType: alignment.dataType, length: alignment.length };
    return partitionFileText;
  }

  get ngSubstitutionModelCmd(): string {
    return `${this.substitutionModel.cmdValue}${this.ngStationaryFrequencies.cmdValue}${this.ngInvariantSites.cmdValue}${this.ngRateHeterogeneity.cmdValue}${this.ngAscertainmentBias.cmdValue}`;
  }

  get status(): string {
    if ( this.error ) {
      return `Error: ${this.error}`;
    }
    if ( !this.parsingComplete ) {
      return 'Parsing...';
    }
    if ( !this.typecheckingComplete ) {
      return 'Type checking...';
    }
    if ( !this.checkRunComplete ) {
      return 'Check run with RAxML...';
    }
    return 'ok';
  }

  get modelExtra(): ModelExtra | null {
    switch ( this.dataType ) {
      case 'protein':
        // Raxml-ng does not have the aa substitution matrix parameter
        if ( this.run.usesRaxmlNg ) {
          return null;
        }
        return {
          label: 'Matrix name',
          options: raxmlSettings.aminoAcidSubstitutionMatrixOptions.options,
          value: this.aaMatrixName,
          onChange: this.onChangeAAMatrixName,
          notAvailable: false,
          hoverInfo: 'Amino Acid Substitution Matrix name',
          error: null,
        };
      default:
        return null;
    }
  }

  get modelTestCanRun(): boolean {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  modeltestLoading = false;

  runModelTest = async (): Promise<void> => {
    // Show an error if there are not enough sequences and dont start the run
    if ( this.numSequences < 3 ) {
      this.run.parent.onError(
        new UserFixError(
          'ModelTest can only be run on alignments with more than two sequences.',
        ),
      );
      return;
    }
    const { dataType } = this;
    // dataType check narrows for the compiler; modelTestCanRun already excludes undefined.
    if ( !this.modelTestCanRun || dataType === undefined ) {
      return;
    }
    const binaryName = this.run.modeltestName;
    if ( binaryName === undefined ) {
      throw new Error( 'No modeltest binary in the binaries list' );
    }
    this.modeltestLoading = true;
    const { rendererBridge } = window;
    await rendererBridge.startModelSelection( {
      id: this.id,
      filePath: this.path,
      outputDir: this.run.outputDir,
      dataType,
      numThreads: this.run.numThreads.value,
      binaryName,
    } );
  };

  cancelModelTest = (): void => {
    if ( this.modeltestLoading ) {
      this.modeltestLoading = false;
      const { rendererBridge } = window;
      rendererBridge.cancelModelSelection( this.id );
    }
  };

  setModelFromString = ( { raxml, extraFlag, raxmlNG }: ModelSelectionResult ): void => {
    this.modeltestLoading = false;
    // For raxml-ng
    let model = raxmlNG.split( '+' )[0];
    // Two models have different names in modeltest-ng and raxml-ng
    model = model.replace( 'TrN', 'TN93' );
    model = model.replace( 'TPM1', 'K81' );
    this.substitutionModel.setValue( model );
    const frequencies = raxmlNG.match( /\+F[O|E]?/ );
    if ( frequencies ) {
      this.ngStationaryFrequencies.setValue( frequencies[0] );
    }
    const invariantSites = raxmlNG.match( /\+IC?/ );
    if ( invariantSites ) {
      this.ngInvariantSites.setValue( invariantSites[0] );
    }
    const rateHeterogeneity = raxmlNG.match( /\+GA?/ );
    if ( rateHeterogeneity ) {
      this.ngRateHeterogeneity.setValue( rateHeterogeneity[0] );
    }
    if ( /\+ASC_LEWIS/.test( raxmlNG ) ) {
      this.ngAscertainmentBias.setValue( '+ASC_LEWIS' );
    }

    model = raxml;
    // For raxml
    if ( /F$/.test( raxml ) ) {
      this.run.baseFrequencies.setValue( 'F' );
      model = model.slice( 0, -1 );
    } else if ( /X$/.test( raxml ) ) {
      this.run.estimatedFrequencies.setValue( true ); // for all but proteins
      this.run.baseFrequencies.setValue( 'X' ); // for proteins
      model = model.slice( 0, -1 );
    } else {
      this.run.baseFrequencies.setValue( 'default' );
    }

    if ( this.dataType === 'protein' ) {
      console.log( 'parsing matrix name...' );
      const { options } = raxmlSettings.aminoAcidSubstitutionMatrixOptions;
      const re = new RegExp( `(${options.join( '|' )})$` );
      // Null on an unlisted matrix throws a TypeError, as before; #403 owns that case.
      const matrixName = re.exec( model )![1];
      this.aaMatrixName = matrixName;
      model = model.replace( re, '' );
    }
    // I couldnt find information if ModelTest checks for ASC_
    this.run.substitutionAscertainment.setValue( 'none' );

    // Check for invariant sites
    if ( /I$/.test( model ) ) {
      this.run.substitutionI.setValue( '+I (ML estimate)' );
      model = model.slice( 0, -1 );
    } else {
      this.run.substitutionI.setValue( 'none' );
    }
    // Check for substitution rates
    if ( /GAMMA/.test( model ) ) {
      this.run.substitutionRate.setValue( 'GAMMA' );
      model = model.replace( 'GAMMA', '' );
    }
    if ( /CAT/.test( model ) ) {
      this.run.substitutionRate.setValue( 'CAT' );
    }
    // Checks for the different nucleotide substitution matrices
    // Default is GTR
    if ( extraFlag === '--JC69' ) {
      this.run.substitutionMatrix.setValue( 'JC' );
      // We dont allow CAT model for this matrix
      this.run.substitutionRate.setValue( 'GAMMA' );
    }
    if ( extraFlag === '--K80' ) {
      this.run.substitutionMatrix.setValue( 'K80' );
      // We dont allow CAT model for this matrix
      this.run.substitutionRate.setValue( 'GAMMA' );
    }
    if ( extraFlag === '--HKY85' ) {
      this.run.substitutionMatrix.setValue( 'HKY' );
      // We dont allow CAT model for this matrix
      this.run.substitutionRate.setValue( 'GAMMA' );
    }
  };

  loadParsedAlignment = async (): Promise<void> => {
    const { rendererBridge } = window;
    try {
      const parsed = await rendererBridge.parseAlignment( this.id, this.path );
      const { alignment, change } = parsed;
      const newDataType = getFinalDataType( [
        ...this.run.alignments.map( ( { dataType } ) => dataType ),
        alignment.dataType,
      ] );
      runInAction( () => {
        if ( this.run.dataType !== newDataType ) {
          this.run.substitutionMatrix.value =
            raxmlMatrixOptions[newDataType].default;
        }
        // When the alignment has finished processing take the default substitution model for this datatype
        this.substitutionModel.value =
          raxmlNgModelOptions[alignment.dataType]?.default;
        this.sequences = alignment.sequences;
        this.fileFormat = alignment.fileFormat;
        this.numSequences = alignment.numSequences;
        this.length = alignment.length;
        this.parsingComplete = true;
        this.numSequencesParsed = this.numSequences;
        this.dataType = alignment.dataType;
        this.hasInvariantSites = alignment.hasInvariantSites;
        this.typecheckingComplete = alignment.typecheckingComplete;
        this.loading = false;
        if ( change ) {
          this.path = change.newFilePath;
          this.convertedFrom = change.format;
          this.converted = change.converted ?? false;
          this.modified = change.modified ?? false;
          this.modificationMessages = change.modificationMessages;
          if ( change.modificationMessages.length > 0 ) {
            this.showModifiedDialog = true;
          } else {
            this.showModifiedSnack = true;
          }
        }
      } );
    } catch ( bridgeError: unknown ) {
      const error = restoreUserFixError( bridgeError );
      runInAction( () => {
        console.error( `Error loading file '${this.path}':`, error );
        this.error = error;
        this.loading = false;
        this.run.error = error;
        this.remove();
      } );
    }
  };

  onModelSelectionSuccess = ( { id, result }: ModelSelectionSuccessPayload ): void => {
    if ( id === this.id ) {
      console.log( id, 'Modeltest result:', result );
      this.setModelFromString( result );
      this.run.afterRun();
    }
  };

  onModelSelectionFailure = ( { id, error }: ModelSelectionFailurePayload ): void => {
    if ( id === this.id ) {
      this.modeltestLoading = false;
      console.log( id, 'Modeltest error:', error );
      this.run.error = error;
      this.run.afterRun();
    }
  };

  listen = (): void => {
    this.loadParsedAlignment();
    this.subscribe( runEvents.onModelSelectionSuccess, this.onModelSelectionSuccess );
    this.subscribe( runEvents.onModelSelectionFailure, this.onModelSelectionFailure );
    this.subscribe( runEvents.onRunStdout, this.onRunStdout );
    this.subscribe( runEvents.onRunStderr, this.onRunStderr );
  };

  clearModified = (): void => {
    this.showModifiedSnack = false;
    this.showModifiedDialog = false;
  };

  dispose(): void {
    this.unlisten();
    if ( this.modeltestLoading ) {
      this.cancelModelTest();
    }
  }

  remove = (): void => {
    this.dispose();
    this.run.removeAlignment( this );
  };

  onChangeModel = ( event: { target: { value: string } } ): void => {
    console.log( 'onChangeModel' );
    this.model = event.target.value;
  };

  onChangeAAMatrixName = ( value: string ): void => {
    console.log( 'onChangeAAMatrixName' );
    this.aaMatrixName = value;
  };

  onRunStdout = ( { id, content }: RunOutputPayload ): void => {
    if ( id === this.id ) {
      // TODO: Keep local log?
      this.run.stdout += content;
    }
  };

  onRunStderr = ( { id, content }: RunOutputPayload ): void => {
    if ( id === this.id ) {
      this.run.stderr += content;
    }
  };

  getSequenceCode = ( taxon: string ): string => {
    // TODO: Sort sequences on taxon for quicker search, intersection and union
    const seq = this.sequences.find( ( seq ) => seq.taxon === taxon );
    if ( seq !== undefined ) {
      return seq.code;
    }
    return '-'.repeat( this.length );
  };
}

export default Alignment;
