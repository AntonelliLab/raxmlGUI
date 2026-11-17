import { observable, observableRef, computed, action, runInAction, createAtom, makeObservable } from 'mobx';
import { promisedComputed } from '../promisedComputed';
import filenamify from 'filenamify';

import Alignment from './Alignment';
import FinalAlignment from './FinalAlignment';
import AstralTree from './AstralTree';
import StoreBase, { runEvents } from './StoreBase';
import { host } from './host';
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
import { basename, join, quote } from '../paths';
import remove from 'lodash/remove';
import UserFixError from '../../common/errors';

const { windows } = host;

class Run extends StoreBase {
  constructor( parent, id ) {
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
      numSites: computed,
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

  binary = new Binary( this );
  numThreads = new NumThreads( this );

  raxmlNgSwitch = ( raxmlNgParam, raxmlParam ) => {
    if ( this.usesRaxmlNg ) {
      return raxmlNgParam;
    }
    return raxmlParam;
  };

  get analysis() {
    return this.raxmlNgSwitch( new RaxmlNgAnalysis( this ), new Analysis( this ) );
  }

  get analysisOption() {
    return this.raxmlNgSwitch(
      raxmlNgAnalysisOptions.find( ( opt ) => opt.value === this.analysis.value ),
      analysisOptions.find( ( opt ) => opt.value === this.analysis.value ),
    );
  }

  // Analysis params
  substitutionMatrix = new SubstitutionMatrix( this );
  substitutionI = new SubstitutionI( this );
  substitutionRate = new SubstitutionRate( this );
  substitutionAscertainment = new SubstitutionAscertainment( this );
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
  startingTree = new StartingTree( this );

  tree = new Tree( this );
  backboneConstraint = new BackboneConstraintTree( this );
  multifurcatingConstraint = new MultifurcatingConstraintTree( this );

  chooseTree = async ( type ) => {
    const { rendererBridge } = /** @type {any} */ ( window );
    const chosen = await rendererBridge.selectTree( this.id, type );
    if ( !chosen ) {
      return;
    }
    this.addTreeFiles( chosen.type, [{ path: chosen.filePath }] );
  };

  loadTreeFile = () => this.chooseTree( 'tree' );

  loadBackboneConstraintFile = () => this.chooseTree( 'backboneConstraint' );

  loadMultifurcatingConstraintFile = () => this.chooseTree( 'multifurcatingConstraint' );

  disableCheckUndeterminedSequence = true;

  outputName = 'output';
  setOutputName = ( value ) => {
    this.outputName = filenamify( value.replace( /\s+/g, '_' ).trim() );
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
      if ( !check ) {
        return defaultValue;
      }
      const { rendererBridge } = /** @type {any} */ ( window );
      return rendererBridge.checkOutput( {
        outputDir,
        outputName: outputNameToCheck,
      } );
    },
  );

  get outputNameOk() {
    return this.outputNameAvailable.get().ok;
  }

  get outputNameSafe() {
    return (
      this.outputNameAvailable.get().outputNameUnused ||
      this.outputNamePlaceholder
    );
  }

  get outputNameNotice() {
    return this.outputNameOk
      ? ''
      : `Output with that id already exists. New run will use output id '${this.outputNameSafe}'`;
  }

  get outputFilenameSafe() {
    return `${this.outputNameSafe}.tre`;
  }

  outputDir = '';
  setOutputDir = ( dir ) => {
    this.outputDir = dir;
  };
  selectOutputDir = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    const outputDir = await rendererBridge.selectOutputDir( this.id );
    if ( !outputDir ) {
      return;
    }
    this.setOutputDir( outputDir );
  };

  openOutputDir = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( this.outputDir );
  };

  showPartitionFor = null;
  showPartition = ( alignment ) => {
    this.showPartitionFor = alignment;
  };
  hidePartition = () => {
    this.showPartition( null );
  };

  // Result
  resultDir = '';
  get resultFilenames() {
    return this.outputNameAvailable.get().resultFilenames || [];
  }

  get haveResult() {
    return this.resultFilenames.length > 0 && this.resultDir === this.outputDir;
  }

  openFile = async ( filePath ) => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( filePath );
  };

  get haveAlignments() {
    return this.alignments.length > 0;
  }

  get hasAstralTree() {
    return !!this.astralTree;
  }

  get taxons() {
    return this.haveAlignments
      ? this.alignments[0].taxons
      : [];
  }

  get dataType() {
    return this.finalAlignment.dataType;
  }

  error = null;

  get missing() {
    if ( !this.tree.notAvailable && !this.tree.filePath ) {
      return 'Missing tree, please load one.';
    }
    return '';
  }

  running = false;
  finished = false;
  exitCode = 0;
  clearFinished = () => {
    this.finished = false;
    this.exitCode = 0;
  };
  atomFinished;

  get ok() {
    return !this.error && !this.missing;
  }

  get startDisabled() {
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
  get seedParsimony() {
    return this.randomSeed;
  }
  get seedRapidBootstrap() {
    return this.randomSeed;
  }
  get seedBootstrap() {
    return this.randomSeed;
  }

  setRandomSeed = ( value ) => {
    const v = Number( value );
    if ( !Number.isNaN( v ) && v !== 0 && v < 1e6 ) {
      this.randomSeed = v;
    }
  };

  get haveRandomSeed() {
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

  get usesRaxmlNg() {
    return this.binary.value.includes( 'raxml-ng' );
  }

  get usesModeltestNg() {
    return this.binary.value.includes( 'modeltest-ng' );
  }

  get inputIsAlignment() {
    return this.usesModeltest || this.usesRaxml;
  }

  get inputIsTree() {
    return this.usesAstral;
  }

  get usesModeltest() {
    return this.binary.type === 'modeltest';
  }

  get usesRaxml() {
    return this.binary.type === 'raxml';
  }

  get usesAstral() {
    return this.binary.type === 'astral';
  }

  get modelTestCanRun() {
    return this.dataType === 'nucleotide' || this.dataType === 'protein';
  }

  get modelTestIsRunningOnAlignment() {
    const running = this.alignments.some(
      ( alignment ) => alignment.modeltestLoading,
    );
    return running;
  }

  cancelModeltestOnAlignment = () => {
    this.alignments.forEach( ( alignment ) => alignment.cancelModelTest() );
  };

  get args() {
    if ( this.usesAstral ) {
      return this.astralArgs();
    }
    if ( this.usesModeltestNg ) {
      return this.modeltestNgArgs();
    }
    if ( this.usesRaxmlNg ) {
      return this.raxmlNgArgs();
    }
    return this.raxmlArgs();
  }

  get ngSubstitutionModelCmd() {
    return this.haveAlignments
      ? this.alignments[0].ngSubstitutionModelCmd
      : '';
  }

  get showModifiedSnack() {
    const shouldShow = this.alignments
      .map( ( a ) => a.showModifiedSnack )
      .some( ( e ) => e );
    return this.haveAlignments && shouldShow;
  }

  get showModifiedDialog() {
    const shouldShow = this.alignments
      .map( ( a ) => a.showModifiedDialog )
      .some( ( e ) => e );
    return this.haveAlignments && shouldShow;
  }

  get modificationMessages() {
    const messages = [];
    this.alignments.forEach( ( a ) => {
      messages.push( `${a.name}:\n` );
      a.modificationMessages.forEach( ( b ) => {
        messages.push( `${b}\n` );
      } );
    } );
    return messages;
  }

  get converted() {
    const converted = this.alignments.map( ( a ) => a.converted ).some( ( e ) => e );
    return this.haveAlignments && converted;
  }

  get modified() {
    const modified = this.alignments.map( ( a ) => a.modified ).some( ( e ) => e );
    return this.haveAlignments && modified;
  }

  get convertedAlignmentFrom() {
    if ( !this.haveAlignments ) {
      return null;
    }
    const convertedAlignments = this.alignments.filter( ( a ) => a.converted );
    return convertedAlignments[0].convertedFrom;
  }

  clearShowModified = () => {
    for ( let i = 0; i < this.alignments.length; i++ ) {
      this.alignments[i].clearModified();
    }
  };

  get raxmlSubstitutionModelCmd() {
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

  astralArgs = () => {
    const first = [];
    first.push( '-i', quote( this.astralTree?.path, { windows } ) );
    first.push(
      '-o',
      quote( join( this.outputDir, `ASTRAL_${this.outputNameSafe}.tre` ), { windows } ),
    );
    return [first];
  };

  modeltestNgArgs = () => {
    const first = [];
    // data type
    if ( this.dataType === 'nucleotide' ) {
      first.push( '-d', 'nt' );
    } else if ( this.dataType === 'protein' ) {
      first.push( '-d', 'aa' );
    }
    // alignment file
    first.push( '-i', quote( this.finalAlignment.path, { windows } ) );
    // output file, modeltest errors if this file already exists
    first.push(
      '-o',
      quote( join( this.outputDir, `RAxML_GUI_ModelTest_${this.outputNameSafe}` ), { windows } ),
    );
    // modeltest throws errors if the output file already exists
    first.push( '--force' );
    // Number of processors
    first.push( '-p', this.numThreads.value );
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
    switch ( this.analysis.value ) {
      case 'SC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push( '--check' );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.backboneConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.backboneConstraint.filePath, { windows } ),
          );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.multifurcatingConstraint.filePath, { windows } ),
          );
        }
        break;
      case 'CC':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
        first.push( '--parse' );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.backboneConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.backboneConstraint.filePath, { windows } ),
          );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.multifurcatingConstraint.filePath, { windows } ),
          );
        }
        break;
      case 'TI':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#tree-inference
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        if ( !this.numThreads.notAvailable ) {
          first.push( '--threads', this.numThreads.value );
        }
        first.push( '--seed', this.seedParsimony );
        if ( this.outGroup.cmdValue ) {
          first.push( '--outgroup', this.outGroup.cmdValue );
        }
        first.push( '--tree', `rand{${this.numRuns.value}}` );
        if ( this.backboneConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.backboneConstraint.filePath, { windows } ),
          );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.multifurcatingConstraint.filePath, { windows } ),
          );
        }
        break;
      case 'ML+tBS+con':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push( '--all' );
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        first.push( '--seed', this.seedParsimony );
        if ( !this.numThreads.notAvailable ) {
          first.push( '--threads', this.numThreads.value );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '--outgroup', this.outGroup.cmdValue );
        }
        first.push( '--bs-metric', 'fbp' );
        first.push( '--tree', `rand{${this.numRuns.value}}` );
        first.push( '--bs-trees', this.numRepetitionsNg.value );
        if ( this.backboneConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.backboneConstraint.filePath, { windows } ),
          );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.multifurcatingConstraint.filePath, { windows } ),
          );
        }
        break;
      case 'ML+TBE+con':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push( '--all' );
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        first.push( '--seed', this.seedParsimony );
        if ( !this.numThreads.notAvailable ) {
          first.push( '--threads', this.numThreads.value );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '--outgroup', this.outGroup.cmdValue );
        }
        first.push( '--bs-metric', 'tbe' );
        first.push( '--tree', `rand{${this.numRuns.value}}` );
        first.push( '--bs-trees', this.numRepetitionsNg.value );
        if ( this.backboneConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.backboneConstraint.filePath, { windows } ),
          );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push(
            '--tree-constraint',
            quote( this.multifurcatingConstraint.filePath, { windows } ),
          );
        }
        break;
      case 'AS':
        // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
        // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
        first.push( '--ancestral' );
        first.push( '--msa', quote( this.finalAlignment.path, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '--model', quote( this.partitionFile, { windows } ) );
        } else if ( this.alignments.length > 1 ) {
          first.push( '--model', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        } else {
          first.push( '--model', this.ngSubstitutionModelCmd );
        }
        first.push(
          '--prefix',
          quote( join( this.outputDir, this.outputNameSafe ), { windows } ),
        );
        first.push( '--tree', quote( this.tree.filePath, { windows } ) );
        break;
      default:
    }
    // Remove items that are only empty strings
    cmdArgs.forEach( ( args ) => remove( args, ( n ) => n === '' ) );
    return cmdArgs.filter( ( args ) => args.length > 0 );
  };

  raxmlArgs = () => {
    const first = [];
    const second = [];
    const third = [];
    const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end

    switch ( this.analysis.value ) {
      case 'FT': // Fast tree search
        // params: [params.brL, params.SHlike, params.outGroup],
        // cmd= """cd %s %s &&%s %s -f E -p %s %s -n %s -s %s -O -w %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, mod, out_file, seq_file, path_dir, part_f, cmd_temp1,cmd_temp2, winEx)
        //TODO: Where is outGroup? From line 1436 in original code, -o is unchecked
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'E' );
        first.push( '-p', this.seedParsimony );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.branchLength.value ) {
          const treeFile1 = join(
            this.outputDir,
            `RAxML_fastTree.${this.outputFilenameSafe}`,
          );
          const next = [];
          if ( !this.numThreads.notAvailable ) {
            next.push( '-T', this.numThreads.value );
          }
          next.push( '-f', 'e' );
          next.push( '-m', this.raxmlSubstitutionModelCmd );
          next.push( this.substitutionMatrix.extraCmdValue );
          next.push( this.substitutionAscertainment.extraCmdValue );
          if ( !this.multistateModel.notAvailable ) {
            next.push( '-K', this.multistateModel.value );
          }
          next.push( '-t', quote( treeFile1, { windows } ) );
          next.push( '-n', `brL.${this.outputFilenameSafe}` );
          next.push( '-s', quote( this.finalAlignment.path, { windows } ) );
          next.push( '-w', quote( this.outputDir, { windows } ) );
          if ( this.havePartitionFile ) {
            next.push( '-q', quote( this.partitionFile, { windows } ) );
          } else if ( !this.finalAlignment.partition.isDefault ) {
            next.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
          }
          cmdArgs.push( next );
        }
        if ( this.sHlike.value ) {
          const treeFile2 = this.branchLength.value
            ? join(
              this.outputDir,
              `RAxML_result.brL.${this.outputFilenameSafe}`,
            )
            : join( this.outputDir, `RAxML_fastTree.${this.outputFilenameSafe}` );
          const next = [];
          if ( !this.numThreads.notAvailable ) {
            next.push( '-T', this.numThreads.value );
          }
          next.push( '-f', 'e' );
          next.push( '-m', this.raxmlSubstitutionModelCmd );
          next.push( this.substitutionMatrix.extraCmdValue );
          next.push( this.substitutionAscertainment.extraCmdValue );
          if ( !this.multistateModel.notAvailable ) {
            next.push( '-K', this.multistateModel.value );
          }
          next.push( '-t', quote( treeFile2, { windows } ) );
          next.push( '-n', `sh.${this.outputFilenameSafe}` );
          next.push( '-s', quote( this.finalAlignment.path, { windows } ) );
          next.push( '-w', quote( this.outputDir, { windows } ) );
          if ( this.havePartitionFile ) {
            next.push( '-q', quote( this.partitionFile, { windows } ) );
          } else if ( !this.finalAlignment.partition.isDefault ) {
            next.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
          }
          cmdArgs.push( next );
        }
        break;
      case 'ML': // ML search
        // params: [params.SHlike, params.combinedOutput, params.outGroup],
        // cmd= """cd %s %s&&%s %s -f d %s -N %s -O -p %s %s -s %s -n %s %s -w %s %s %s %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, mod, BSrep2.get(), random.randrange(1, 1000, 1), o, seq_file, out_file, part_f, path_dir, const_f, result2, cmd_temp2, combine_trees, winEx)
        //TODO: Check conf_f (from line 754 in original source)
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'd' );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        first.push( '-N', this.numRuns.value );
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        first.push( '-p', this.seedParsimony );
        first.push( '-n', this.outputFilenameSafe );
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          first.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }
        if ( this.sHlike.value ) {
          const treeFile = join(
            this.outputDir,
            `RAxML_bestTree.${this.outputFilenameSafe}`,
          );
          const next = [];
          if ( !this.numThreads.notAvailable ) {
            next.push( '-T', this.numThreads.value );
          }
          next.push( '-f', 'e' );
          next.push( '-m', this.raxmlSubstitutionModelCmd );
          next.push( this.substitutionMatrix.extraCmdValue );
          next.push( this.substitutionAscertainment.extraCmdValue );
          if ( !this.multistateModel.notAvailable ) {
            next.push( '-K', this.multistateModel.value );
          }
          next.push( '-t', quote( treeFile, { windows } ) );
          next.push( '-n', `sh.${this.outputFilenameSafe}` );
          next.push( '-s', quote( this.finalAlignment.path, { windows } ) );
          next.push( '-w', quote( this.outputDir, { windows } ) );
          if ( this.havePartitionFile ) {
            next.push( '-q', quote( this.partitionFile, { windows } ) );
          } else if ( !this.finalAlignment.partition.isDefault ) {
            next.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
          }
          cmdArgs.push( next );
        }
        break;
      case 'ML+rBS': // ML + rapid bootstrap
        // params: [params.reps, params.brL, params.outGroup],
        // cmd= """cd %s %s&& %s %s %s -f a -x %s %s %s -p %s -N %s %s -s %s -n %s %s -O -w %s %s %s %s""" \
        // % (winD, raxml_path, runWin, K[0], pro, seed_1, save_brL.get(),mod, seed_2, BSrep.get(), o, seq_file, out_file, \
        // part_f, path_dir, const_f, result, winEx)
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'a' );
        first.push( '-x', this.seedRapidBootstrap );
        first.push( '-p', this.seedParsimony );
        first.push( '-N', this.numRepetitions.value );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.branchLength.value ) {
          first.push( '-k' );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          first.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
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
          `RAxML_bestTree.${outputFilenameSafe2}`,
        ); // MLtreeR
        const treesFile = join(
          this.outputDir,
          `RAxML_bootstrap.${outputFilenameSafe1}`,
        ); // trees
        // first wrote RAxML_bootstrap.binary_8R.tre
        // second wrote RAxML_bootstrap.binary_8B.tre

        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-b', this.seedBootstrap );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.branchLength.value ) {
          first.push( '-k' );
        }
        first.push( '-p', this.seedParsimony );
        first.push( '-N', this.numRepetitions.value );
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        first.push( '-n', outputFilenameSafe1 );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          first.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }

        if ( !this.numThreads.notAvailable ) {
          second.push( '-T', this.numThreads.value );
        }
        second.push( '-f', 'd' );
        second.push( '-m', this.raxmlSubstitutionModelCmd );
        second.push( this.substitutionMatrix.extraCmdValue );
        second.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          second.push( '-K', this.multistateModel.value );
        }
        second.push( '-p', this.seedParsimony );
        second.push( '-N', this.numRuns.value );
        if ( this.disableCheckUndeterminedSequence ) {
          second.push( '-O' );
        }
        if ( this.outGroup.cmdValue ) {
          second.push( '-o', this.outGroup.cmdValue );
        }
        second.push( '-n', outputFilenameSafe2 );
        second.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        second.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          second.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          second.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          second.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          second.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }

        if ( !this.numThreads.notAvailable ) {
          third.push( '-T', this.numThreads.value );
        }
        third.push( '-f', 'b' );
        third.push( '-t', quote( treeFile, { windows } ) );
        third.push( '-z', quote( treesFile, { windows } ) );
        third.push( '-m', this.raxmlSubstitutionModelCmd );
        third.push( this.substitutionMatrix.extraCmdValue );
        third.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          third.push( '-K', this.multistateModel.value );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          third.push( '-O' );
        }
        third.push( '-n', this.outputFilenameSafe );
        third.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        third.push( '-w', quote( this.outputDir, { windows } ) );

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
          `RAxML_bootstrap.${this.outputFilenameSafe}`,
        );
        const consensusOutput = `consensus.${this.outputFilenameSafe}`;

        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        if ( this.branchLength.value ) {
          first.push( '-k' );
        }
        first.push( '-x', this.seedRapidBootstrap );
        first.push( '-p', this.seedParsimony );
        first.push( '-N', this.numRepetitions.value );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          first.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }

        if ( !this.numThreads.notAvailable ) {
          second.push( '-T', this.numThreads.value );
        }
        second.push( '-m', this.raxmlSubstitutionModelCmd );
        second.push( this.substitutionMatrix.extraCmdValue );
        second.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          second.push( '-K', this.multistateModel.value );
        }
        second.push( '-J', 'MR' );
        second.push( '-w', quote( this.outputDir, { windows } ) );
        second.push( '-z', quote( bsTreeFile, { windows } ) );
        second.push( '-n', consensusOutput );
        if ( this.backboneConstraint.isSet ) {
          second.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          second.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }
        break;
      case 'AS': // Ancestral states
        // params: [params.tree],
        // cmd = """cd %s %s &&%s %s -f A -t "%s" -s %s %s -n %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, rooted_tree, seq_file, mod, out_file, path_dir, part_f, winEx)
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'A' );
        first.push( '-t', quote( this.tree.filePath, { windows } ) );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        break;
      case 'PD': // Pairwise distances
        // params: [params.startingTree],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // cmd = """cd %s %s &&%s %s -f x -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // % (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'x' );
        first.push( '-p', this.seedParsimony );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        if ( !this.tree.notAvailable ) {
          first.push( '-t', quote( this.tree.filePath, { windows } ) );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        break;
      case 'RBS': // Rell bootstraps
        // params: [params.reps, params.brL, params.outGroup],
        // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
        // 	cmd = """cd %s %s &&%s %s -f D -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
        // 	% (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
        if ( !this.numThreads.notAvailable ) {
          first.push( '-T', this.numThreads.value );
        }
        first.push( '-f', 'D' );
        first.push( '-p', this.seedParsimony );
        first.push( '-m', this.raxmlSubstitutionModelCmd );
        first.push( this.substitutionMatrix.extraCmdValue );
        first.push( this.substitutionAscertainment.extraCmdValue );
        if ( this.branchLength.value ) {
          first.push( '-k' );
        }
        if ( this.outGroup.cmdValue ) {
          first.push( '-o', this.outGroup.cmdValue );
        }
        if ( !this.multistateModel.notAvailable ) {
          first.push( '-K', this.multistateModel.value );
        }
        if ( this.disableCheckUndeterminedSequence ) {
          first.push( '-O' );
        }
        first.push( '-n', this.outputFilenameSafe );
        first.push( '-s', quote( this.finalAlignment.path, { windows } ) );
        // if (!this.tree.notAvailable) {
        //   first.push('-t', this.tree.filePath);
        // }
        first.push( '-w', quote( this.outputDir, { windows } ) );
        if ( this.havePartitionFile ) {
          first.push( '-q', quote( this.partitionFile, { windows } ) );
        } else if ( !this.finalAlignment.partition.isDefault ) {
          first.push( '-q', quote( this.finalAlignment.partitionFilePath, { windows } ) );
        }
        if ( this.backboneConstraint.isSet ) {
          first.push( '-r', quote( this.backboneConstraint.filePath, { windows } ) );
        }
        if ( this.multifurcatingConstraint.isSet ) {
          first.push( '-g', quote( this.multifurcatingConstraint.filePath, { windows } ) );
        }
        break;
      default:
    }
    // Remove items that are only empty strings
    cmdArgs.forEach( ( args ) => remove( args, ( n ) => n === '' ) );
    return cmdArgs.filter( ( args ) => args.length > 0 );
  };

  get command() {
    if ( this.usesAstral ) {
      return this.args
        .map( ( cmdArgs ) => `java -jar ${this.binary.value} ${cmdArgs.join( ' ' )}` )
        .join( ' &&\\\n' );
    }
    return this.args
      .map( ( cmdArgs ) => `${this.binary.value} ${cmdArgs.join( ' ' )}` )
      .join( ' &&\\\n' );
  }

  get settingsFileContent() {
    let text = `The analysis was run using raxmlGUI 2.0 (version ${this.version}) as follows:
Analysis: ${this.analysisOption.title}
Binary: ${this.binary.value} version ${this.binary.version}
Results saved to: ${this.outputDir}
`;
    let argumentext = 'RAxML was called with these arguments:\n';
    this.args.map(
      ( arg, index ) => ( argumentext += `${index + 1}.) ${arg.join( ' ' )}\n` ),
    );
    text += argumentext;
    // TODO: should we be more precise about what the single params mean?
    //     text += `To repeat the analysis use the following seeds:
    // Bootstrap seed: ${this.seedBootstrap}
    // Parsimony seed: ${this.seedParsimony}`;
    return text;
  }

  get settingsFilePath() {
    return join(
      `${this.outputDir}`,
      `RAxML_GUI_Settings_${this.outputNameSafe}.txt`,
    );
  }

  writeSettings = async () => {
    try {
      console.log( `Writing settings to ${this.settingsFilePath}...` );
      const { rendererBridge } = /** @type {any} */ ( window );
      await rendererBridge.writeFile( this.settingsFilePath, this.settingsFileContent );
    } catch ( err ) {
      console.error( 'Error writing settings:', err );
      throw err;
    }
  };

  startAstral = async () => {
    const { id, binary, args } = this;
    console.log( `Start astral run ${id}` );
    this.running = true;
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.startAstral( {
      id,
      binaryName: binary.value,
      args,
    } );
  };

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
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.startRun( {
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
    } );
  };

  cancel = () => {
    this.startToken = null;
    const { rendererBridge } = /** @type {any} */ ( window );
    rendererBridge.cancelRun( this.id );
    this.afterRun();
  };

  afterRun = () => {
    this.running = false;
    this.atomAfterRun.reportChanged();
  };

  alignments = [];
  astralTree = undefined;
  code = undefined;
  data = '';
  path = undefined;
  stdout = '';
  stderr = '';

  useBackboneConstraint = false;
  useMultifurcatingConstraint = false;

  get numSites() {
    return this.alignments.reduce( ( sum, n ) => sum + n, 0 );
  }

  get needAlignment() {
    return true;
  }

  removeRun = () => {
    this.parent.deleteRun( this );
  };

  loadAlignmentFiles = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    const alignments = await rendererBridge.selectAlignment( this.id );
    if ( !alignments ) {
      return;
    }
    this.addAlignments( alignments );
  };

  loadAstralTree = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    const file = await rendererBridge.selectAstralFile( this.id );
    if ( !file ) {
      return;
    }
    this.addAstralFiles( file );
  };

  haveAlignment = ( id ) => {
    // TODO: Input.js queries without id, doe it work as expected? Later queries with path instead of id
    return this.alignments.findIndex( ( alignment ) => alignment.id === id ) >= 0;
  };

  addAlignments = ( alignments ) => {
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

  addAstralFiles = ( { path } ) => {
    if ( !this.hasAstralTree ) {
      this.astralTree = new AstralTree( this, path );
      this.setOutputName( this.astralTree.name );
      if ( !this.outputDir ) {
        this.setOutputDir( this.astralTree.dir );
      }
    }
  };

  removeAlignment = ( alignment ) => {
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

  removeAstralTree = () => {
    this.astralTree = null;
  };

  get canLoadAlignment() {
    return (
      ( this.binary.type === 'raxml' || this.binary.type === 'modeltest' ) &&
      !this.havePartitionFile
    );
  }

  get canLoadAstralTree() {
    return this.usesAstral && !this.hasAstralTree;
  }

  partitionFile = '';
  partitionFileContent = '';

  get partitionFileName() {
    return basename( this.partitionFile );
  }

  get havePartitionFile() {
    return this.partitionFile !== '';
  }

  get canLoadPartitionFile() {
    return this.alignments.length === 1 && !this.havePartitionFile;
  }

  loadPartitionFile = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    const filePath = await rendererBridge.selectPartitionFile( this.id );
    if ( !filePath ) {
      return;
    }
    await this.addPartitionFiles( [{ path: filePath }] );
  };

  addPartitionFiles = async ( files ) => {
    if ( !files.length ) {
      return;
    }
    const { path } = files[0];
    const { rendererBridge } = /** @type {any} */ ( window );
    const content = await rendererBridge.readFile( path );
    runInAction( () => {
      this.partitionFile = path;
      this.partitionFileContent = content;
    } );
  };

  addTreeFiles = ( type, files ) => {
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

  removePartitionFile = () => {
    this.partitionFile = '';
    this.partitionFileContent = '';
  };

  clearStdout = () => {
    this.stdout = '';
  };

  clearStderr = () => {
    this.stderr = '';
  };

  clearConsole = () => {
    this.clearStdout();
    this.clearStderr();
  };

  clearError = () => {
    this.error = null;
  };

  reset = () => {
    this.outGroup.reset();
    this.removePartitionFile();
  };

  dispose = () => {
    this.cancel();
    this.unlisten();
  };

  listen = () => {
    this.subscribe( runEvents.onRunStdout, this.onRunStdout );
    this.subscribe( runEvents.onRunStderr, this.onRunStderr );
    this.subscribe( runEvents.onRunFinished, this.onRunFinished );
    this.subscribe( runEvents.onRunError, this.onRunError );
    this.subscribe( runEvents.onAstralSuccess, this.onAstralSuccess );
  };

  // -----------------------------------------------------------
  // Listeners
  // -----------------------------------------------------------

  onRunStdout = ( { id, content } ) => {
    if ( id === this.id ) {
      this.stdout += content;
    }
  };

  onRunStderr = ( { id, content } ) => {
    if ( id === this.id ) {
      this.stderr += content;
    }
  };

  onAstralSuccess = ( { id, exitCode } ) => {
    if ( id === this.id ) {
      console.log( `Process ${id} finished with exitCode '${exitCode}'` );
      this.resultDir = this.outputDir;
      this.atomFinished.reportChanged();
      this.finished = true;
      this.exitCode = exitCode;
      this.afterRun();
    }
  };

  onRunFinished = ( { id, resultDir, resultFilenames, exitCode } ) => {
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

  onRunError = ( { id, error } ) => {
    if ( id === this.id ) {
      console.log( `Process ${id} finished with error:`, error );
      this.error = error;
      this.afterRun();
    }
  };

  onBackboneConstraint = ( event, params ) => {
    this.useBackboneConstraint = !this.useBackboneConstraint;
  };

  onMultifurcatingConstraint = ( event, params ) => {
    this.useMultifurcatingConstraint = !this.useMultifurcatingConstraint;
  };

  generateReport = ( { maxStdoutLength = 1000 } = {} ) => {
    const { command, stdout } = this;
    return {
      command,
      stdout:
        stdout.length > maxStdoutLength
          ? `[${
            stdout.length - maxStdoutLength
          } more characters]...${stdout.slice( -maxStdoutLength )}`
          : stdout,
    };
  };
}

export default Run;
