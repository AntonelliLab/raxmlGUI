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
import UserFixError from '../../common/errors';
import { host } from './host';

const raxmlMatrixOptions = raxmlSettings.matrixOptions;
const raxmlNgModelOptions = raxmlNgSettings.modelOptions;

class Alignment extends InputFile {
  constructor( run, path ) {
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
      numSites: computed,
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

  error = null;

  dataType = undefined;
  /** @type {string} */
  aaMatrixName =
    raxmlSettings.aminoAcidSubstitutionMatrixOptions.default;

  size = 0;
  fileFormat = undefined;
  convertedFrom = undefined;
  converted = false;
  modified = false;
  modificationMessages = [];
  showModifiedSnack = false;
  showModifiedDialog = false;
  length = 0;
  numSequences = 0;
  sequences = [];
  hasInvariantSites = false;

  get taxons() {
    return this.sequences.map( ( seq ) => seq.taxon );
  }

  parsingComplete = false;
  typecheckingComplete = false;
  loading = true;

  checkRunComplete = false;
  checkRunData = '';
  checkRunSuccess = false;

  // Partition stuff
  get showPartition() {
    return this.run.showPartitionFor === this;
  }

  setShowPartition = ( value = true ) => {
    this.run.showPartition( value
      ? this
      : null );
  };

  hidePartition = () => {
    this.setShowPartition( false );
  };

  setPartitionText = ( value ) => {
    this.partitionText = value;
  };

  partitionText = '';

  get partitionType() {
    if ( this.run.usesRaxmlNg ) {
      return this.ngSubstitutionModelCmd;
    }
    switch ( this.dataType ) {
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
        return this.dataType;
    }
  }

  get partitionFileContent() {
    /*
      DNA, gene1 = 1-3676
      BIN, morph = 3677-3851
    */
    let partitionFileText = '';
    let site = 1;
    let index = 0;
    const total = this.length;
    const name = `${this.dataType}_${index}`;
    partitionFileText += `${this.partitionType}, ${name} = ${site}-${total}\n`;
    // site += alignment.length;
    // return { partitionType, dataType: alignment.dataType, length: alignment.length };
    return partitionFileText;
  }

  get ngSubstitutionModelCmd() {
    return `${this.substitutionModel.cmdValue}${this.ngStationaryFrequencies.cmdValue}${this.ngInvariantSites.cmdValue}${this.ngRateHeterogeneity.cmdValue}${this.ngAscertainmentBias.cmdValue}`;
  }

  get numSites() {
    return this.length;
  }

  get status() {
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

  get modelExtra() {
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
        };
      default:
        return null;
    }
  }

  get modelTestCanRun() {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  modeltestLoading = false;

  runModelTest = async () => {
    // Show an error if there are not enough sequences and dont start the run
    if ( this.numSequences < 3 ) {
      this.run.parent.onError(
        new UserFixError(
          'ModelTest can only be run on alignments with more than two sequences.',
        ),
      );
      return;
    }
    this.modeltestLoading = true;
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.startModelSelection( {
      id: this.id,
      filePath: this.path,
      outputDir: this.run.outputDir,
      dataType: this.dataType,
      numThreads: this.run.numThreads.value,
      binaryName: this.run.modeltestName,
    } );
  };

  cancelModelTest = () => {
    if ( this.modeltestLoading ) {
      this.modeltestLoading = false;
      const { rendererBridge } = /** @type {any} */ ( window );
      rendererBridge.cancelModelSelection( this.id );
    }
  };

  setModelFromString = ( { raxml, extraFlag, raxmlNG } ) => {
    this.modeltestLoading = false;
    // For raxml-ng
    let model = raxmlNG.split( '+' )[0];
    // Two models have different names in modeltest-ng and raxml-ng
    model = model.replace( 'TrN', 'TN93' );
    model = model.replace( 'TPM1', 'K81' );
    this.substitutionModel.setValue( model );
    if ( /\+F[O|E]?/.test( raxmlNG ) ) {
      this.ngStationaryFrequencies.setValue( /\+F[O|E]?/.exec( raxmlNG )[0] );
    }
    if ( /\+IC?/.test( raxmlNG ) ) {
      this.ngInvariantSites.setValue( /\+IC?/.exec( raxmlNG )[0] );
    }
    if ( /\+GA?/.test( raxmlNG ) ) {
      this.ngRateHeterogeneity.setValue( /\+GA?/.exec( raxmlNG )[0] );
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
      const matrixName = re.exec( model )[1];
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
      model = model.replace( 'CAT', '' );
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

  loadParsedAlignment = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    try {
      const parsed = await rendererBridge.parseAlignment( this.id, this.path );
      const { alignment, change } = parsed;
      const newDataType = getFinalDataType(
        this.run.alignments
          .map( ( { dataType } ) => dataType )
          .concat( alignment.dataType ),
      );
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
          this.converted = change.converted;
          this.modified = change.modified;
          this.modificationMessages = change.modificationMessages;
          if ( change.modificationMessages.length > 0 ) {
            this.showModifiedDialog = true;
          } else {
            this.showModifiedSnack = true;
          }
        }
      } );
    } catch ( error ) {
      runInAction( () => {
        console.error( `Error loading file '${this.path}':`, error );
        this.error = error;
        this.loading = false;
        this.run.error = error;
        this.remove();
      } );
    }
  };

  onModelSelectionSuccess = ( { id, result } ) => {
    if ( id === this.id ) {
      console.log( id, 'Modeltest result:', result );
      this.setModelFromString( result );
      this.run.afterRun();
    }
  };

  onModelSelectionFailure = ( { id, error } ) => {
    if ( id === this.id ) {
      this.modeltestLoading = false;
      console.log( id, 'Modeltest error:', error );
      this.run.error = error;
      this.run.afterRun();
    }
  };

  listen = () => {
    this.loadParsedAlignment();
    this.subscribe( runEvents.onModelSelectionSuccess, this.onModelSelectionSuccess );
    this.subscribe( runEvents.onModelSelectionFailure, this.onModelSelectionFailure );
    this.subscribe( runEvents.onRunStdout, this.onRunStdout );
    this.subscribe( runEvents.onRunStderr, this.onRunStderr );
  };

  clearModified = () => {
    this.showModifiedSnack = false;
    this.showModifiedDialog = false;
  };

  dispose() {
    this.unlisten();
    if ( this.modeltestLoading ) {
      this.cancelModelTest();
    }
  }

  remove = () => {
    this.dispose();
    this.run.removeAlignment( this );
  };

  onChangeModel = ( event ) => {
    console.log( 'onChangeModel' );
    this.model = event.target.value;
  };

  onChangeAAMatrixName = ( value ) => {
    console.log( 'onChangeAAMatrixName' );
    this.aaMatrixName = value;
  };

  onRunStdout = ( { id, content } ) => {
    if ( id === this.id ) {
      // TODO: Keep local log?
      this.run.stdout += content;
    }
  };

  onRunStderr = ( { id, content } ) => {
    if ( id === this.id ) {
      this.run.stderr += content;
    }
  };

  getSequenceCode = ( taxon ) => {
    // TODO: Sort sequences on taxon for quicker search, intersection and union
    const seq = this.sequences.find( ( seq ) => seq.taxon === taxon );
    if ( seq !== undefined ) {
      return seq.code;
    }
    return '-'.repeat( this.length );
  };
}

export default Alignment;
