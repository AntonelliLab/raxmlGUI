import { observable, computed, action, runInAction } from 'mobx';
import { ipcRenderer } from 'electron';
import * as ipc from '../../constants/ipc';
import parsePath from 'parse-filepath';
import { join } from 'path';
import fs from 'fs';
import util from 'util';
import union from 'lodash/union';
import intersection from 'lodash/intersection';
import Option from './Option';
import * as raxmlSettings from '../../settings/raxml';
import * as raxmlNgSettings from '../../settings/raxmlng';
import Partition, { FinalPartition } from './Partition';
import { getFinalDataType } from '../../common/typecheckAlignment';
// import { quote } from '../../common/utils';

const raxmlModelOptions = raxmlSettings.modelOptions;
const raxmlNgModelOptions = raxmlNgSettings.modelOptions;

const writeFile = util.promisify(fs.writeFile);

class RaxmlNgAlignmentSubstitutionModel extends Option {
  constructor(alignment) {
    super(alignment.run, '', 'Substitution model');
    this.alignment = alignment;
  }
  @computed get options() {
    if (!this.alignment.run.haveAlignments) {
      return [];
    }
    const modelSettings = raxmlNgModelOptions[this.alignment.dataType];
    if (!modelSettings) {
      return [];
    }
    return modelSettings.options.map(value => ({ value, title: value }));
  }
  @computed get notAvailable() { return !this.alignment.run.haveAlignments; }
  @computed get cmdValue() {
    let model = this.value;
    if (this.alignment.dataType === 'multistate') {
      model = model.replace('x', this.alignment.multistateNumber.value);
    }
    return model;
  }
}

class RaxmlNgModelExtraParam extends Option {
  constructor(alignment, label, options) {
    super(alignment.run, '<none>', label);
    this.alignment = alignment;
    this.optionsSource = options;
  }
  @computed get options() {
    if (!this.run.haveAlignments) {
      return [];
    }
    return [{ value: '<none>', label: 'none' }, ...this.optionsSource].map(
      o => ({
        value: o.value,
        title: o.label
      })
    );
  }
  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      !this.run.usesRaxmlNg
    );
  }
  @computed get cmdValue() {
    return this.value === '<none>' ? '' : this.value;
  }
}

class RaxmlNgModelF extends RaxmlNgModelExtraParam {
  constructor(alignment) {
    super(
      alignment,
      'Stationary frequencies',
      raxmlNgSettings.stationaryFrequenciesOptions.options
    );
  }
}

class RaxmlNgModelI extends RaxmlNgModelExtraParam {
  constructor(alignment) {
    super(
      alignment,
      'Proportion of invariant sites',
      raxmlNgSettings.proportionOfInvariantSitesOptions.options
    );
  }
}

class RaxmlNgModelG extends RaxmlNgModelExtraParam {
  constructor(alignment) {
    super(
      alignment,
      'Rate heterogeneity',
      raxmlNgSettings.amongsiteRateHeterogeneityModelOptions.options
    );
  }
}

class RaxmlNgModelASC extends RaxmlNgModelExtraParam {
  constructor(alignment) {
    super(
      alignment,
      'Ascertainment bias correction',
      raxmlNgSettings.ascertainmentBiasCorrectionOptions.options
    );
  }
  @computed get notAvailable() {
    return (
      !this.run.haveAlignments ||
      !this.run.usesRaxmlNg ||
      this.alignment.hasInvariantSites
    );
  }
}

class MultistateNumber extends Option {
  constructor(alignment) {
    super(alignment.run, '', 'Number of states');
    this.alignment = alignment;
    this.placeholder = 'Integer';
  }
  @computed get notAvailable() { return this.alignment.dataType !== 'multistate' || !this.alignment.run.usesRaxmlNg; }
  @computed get error() { return !this.value || !Number.isInteger(Number(this.value)) }
}


class Alignment {
  run = null;

  @observable path = '';
  @observable error = null;

  @observable dataType = undefined;
  @observable aaMatrixName =
    raxmlSettings.aminoAcidSubstitutionMatrixOptions.default;

  @observable size = 0;
  @observable fileFormat = undefined;
  @observable convertedFrom = undefined;
  @observable converted = false;
  @observable showConverted = false;
  @observable length = 0;
  @observable numSequences = 0;
  @observable sequences = [];
  @observable hasInvariantSites = false;

  @computed get taxons() {
    return this.sequences.map(seq => seq.taxon);
  }

  @observable parsingComplete = false;
  @observable typecheckingComplete = false;
  @observable loading = true;

  @observable checkRunComplete = false;
  @observable checkRunData = '';
  @observable checkRunSuccess = false;
  // @observable taxons = [];

  // Partition stuff
  @computed get showPartition() {
    return this.run.showPartitionFor === this;
  };

  @action
  setShowPartition = (value = true) => {
    this.run.showPartition(value ? this : null);
  };

  @action
  hidePartition = () => {
    this.setShowPartition(false);
  };

  @action
  setPartitionText = value => {
    this.partitionText = value;
  };

  @observable partitionText = '';

  @computed get partitionType() {
    if (this.run.usesRaxmlNg) {
      return this.ngSubstitutionModelCmd;
    }
    switch (this.dataType) {
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

  @computed get partitionFileContent() {
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

  constructor(run, path) {
    this.run = run;
    this.path = path;
    this.substitutionModel = new RaxmlNgAlignmentSubstitutionModel(this);
    this.multistateNumber = new MultistateNumber(this);
    this.ngStationaryFrequencies = new RaxmlNgModelF(this);
    this.ngInvariantSites = new RaxmlNgModelI(this);
    this.ngRateHeterogeneity = new RaxmlNgModelG(this);
    this.ngAscertainmentBias = new RaxmlNgModelASC(this);
    this.partition = new Partition(this);

    this.listen();
  }

  @computed get ngSubstitutionModelCmd() {
    return `${this.substitutionModel.cmdValue}${this.ngStationaryFrequencies.cmdValue}${this.ngInvariantSites.cmdValue}${this.ngRateHeterogeneity.cmdValue}${this.ngAscertainmentBias.cmdValue}`;
  }

  @computed
  get id() {
    return `${this.run.id}_${this.path}`;
  }

  @computed
  get numSites() {
    return this.length;
  }

  @computed
  get name() {
    return parsePath(this.path).name;
  }

  @computed
  get dir() {
    return parsePath(this.path).dir;
  }

  @computed
  get base() {
    return parsePath(this.path).base;
  }

  @computed
  get filename() {
    return parsePath(this.path).base;
  }

  @computed
  get ok() {
    return this.path !== '';
  }

  @computed
  get status() {
    if (this.error) {
      return `Error: ${this.error}`;
    }
    if (!this.parsingComplete) {
      return 'Parsing...';
    }
    if (!this.typecheckingComplete) {
      return 'Type checking...';
    }
    if (!this.checkRunComplete) {
      return 'Check run with RAxML...';
    }
    return 'ok';
  }

  @computed
  get modelExtra() {
    switch (this.dataType) {
      case 'protein':
        // Raxml-ng does not have the aa substitution matrix parameter
        if (this.run.usesRaxmlNg) {
          return null;
        }
        return {
          label: 'Matrix name',
          options: raxmlSettings.aminoAcidSubstitutionMatrixOptions.options,
          value: this.aaMatrixName,
          onChange: this.onChangeAAMatrixName
        };
      default:
        return null;
    }
  }


  @observable modeltestLoading = false;

  @action
  runModelTest = () => {
    this.modeltestLoading = true;
    ipcRenderer.send(ipc.ALIGNMENT_MODEL_SELECTION_REQUEST, {
      id: this.id,
      filePath: this.path,
      dataType: this.dataType,
      numThreads: this.run.numThreads.value,
    });
  }

  @action
  cancelModelTest = () => {
    console.log('Cancel model test!');
    this.modeltestLoading = false;
    ipcRenderer.send(ipc.ALIGNMENT_MODEL_SELECTION_CANCEL, this.id);
  }

  @action
  setModelFromString = ({ raxml, raxmlNG }) => {
    this.modeltestLoading = false;
    // For raxml-ng
    let model = raxmlNG.split('+')[0];
    this.substitutionModel.setValue(model);
    if (/\+F[O|E]?/.test(raxmlNG)) {
      this.ngStationaryFrequencies.setValue(/\+F[O|E]?/.exec(raxmlNG)[0]);
    }
    if (/\+IC?/.test(raxmlNG)) {
      this.ngInvariantSites.setValue(/\+IC?/.exec(raxmlNG)[0]);
    }
    if (/\+GA?/.test(raxmlNG)) {
      this.ngRateHeterogeneity.setValue(/\+GA?/.exec(raxmlNG)[0]);
    }
    if (/\+ASC_LEWIS/.test(raxmlNG)) {
      this.ngAscertainmentBias.setValue('+ASC_LEWIS');
    }

    model = raxml;
    // For raxml
    if (/F$/.test(raxml)) {
      this.run.empiricalFrequencies.setValue(true);
      model = model.slice(0, -1)
    }
    else if (/X$/.test(raxml)) {
      // this.run.mlFrequencies.setValue(true);
      model = model.slice(0, -1)
    }
    if (this.dataType === 'protein') {
      console.log('parsing matrix name...');
      const { options } = raxmlSettings.aminoAcidSubstitutionMatrixOptions;
      const re = new RegExp(`(${options.join('|')})$`);
      const matrixName = re.exec(model)[1];
      this.aaMatrixName = matrixName;
      model = model.replace(re, '');
    }
    this.run.substitutionModel.setValue(model);

  }

  listen = () => {
    // Send alignments to main process for processing
    ipcRenderer.send(ipc.ALIGNMENT_PARSE_REQUEST, {
      id: this.id,
      filePath: this.path
    });
    // Listener taken from processAlignments()
    // Receive a progress update for one of the alignments being parsed
    ipcRenderer.on(ipc.ALIGNMENT_PARSE_SUCCESS, (event, { id, alignment }) => {
      if (id === this.id) {
        const newDataType = getFinalDataType(this.run.alignments.map(({ dataType }) => dataType).concat(alignment.dataType));
        if (this.run.dataType !== newDataType) {
          this.run.substitutionModel.value = raxmlModelOptions[newDataType].default;
        }
        // When the alignment has finished processing take the default ubstitution model for this datatype
        this.substitutionModel.value =
          raxmlNgModelOptions[alignment.dataType].default;
        runInAction(() => {
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
        });
      }
    });
    ipcRenderer.on(ipc.ALIGNMENT_PARSE_FAILURE, (event, { id, error }) => {
      if (id === this.id) {
        runInAction(() => {
          console.error(`Error loading file '${this.path}':`, error);
          this.error = error;
          this.loading = false;
          this.run.error = error;
          this.remove();
        });
      }
    });
    // Called when an alignment is neither fasta nor phylip, in which case we are converting it into fasta
    ipcRenderer.on(
      ipc.ALIGNMENT_PARSE_CHANGED_PATH,
      (event, { id, newFilePath, format }) => {
        if (id === this.id) {
          runInAction(() => {
            this.path = newFilePath;
            this.convertedFrom = format;
            this.converted = true;
            this.showConverted = true;
          });
        }
      }
    );
    ipcRenderer.on(
      ipc.ALIGNMENT_MODEL_SELECTION_SUCCESS,
      (event, { id, result }) => {
        if (id === this.id) {
          console.log(id, 'Modeltest result:', result);
          this.setModelFromString(result);
        }
      }
    );
    ipcRenderer.on(
      ipc.ALIGNMENT_MODEL_SELECTION_FAILURE,
      (event, { id, error }) => {
        if (id === this.id) {
          this.modeltestLoading = false;
          console.log(id, 'Modeltest error:', error);
        }
      }
    );
  };

  @action clearConverted = () => {
    this.showConverted = false;
  };

  @action
  openFile = () => {
    ipcRenderer.send(ipc.FILE_OPEN, this.path);
  };

  @action
  showFileInFolder = () => {
    ipcRenderer.send(ipc.FILE_SHOW_IN_FOLDER, this.path);
  };

  @action
  dispose = () => {
    //TODO: Remove listeners (make callbacks class methods to be able to remove them)
  };

  @action
  remove = () => {
    this.run.removeAlignment(this);
  };

  @action
  onChangeModel = event => {
    console.log('onChangeModel');
    this.model = event.target.value;
  };

  @action
  onChangeAAMatrixName = event => {
    console.log('onChangeAAMatrixName');
    this.aaMatrixName = event.target.value;
  };

  getSequenceCode = taxon => {
    // TODO: Sort sequences on taxon for quicker search, intersection and union
    const seq = this.sequences.find(seq => seq.taxon === taxon);
    if (seq !== undefined) {
      return seq.code;
    }
    return '-'.repeat(this.length);
  };

}

class FinalAlignment {
  constructor(run) {
    this.run = run;
    this.partition = new FinalPartition(run);
  }

  @computed get filename() {
    if (this.numAlignments === 1) {
      return this.run.alignments[0].filename;
    }
    return `RAxML_${this.run.outputNameSafe}_concat.txt`;
  }

  @computed get dir() {
    if (this.numAlignments === 1) {
      return this.run.alignments[0].dir;
    }
    return this.run.outputDir;
  }

  @computed get path() {
    if (this.numAlignments === 1) {
      return this.run.alignments[0].path;
    }
    return join(`${this.dir}`, `${this.filename}`);
  }

  @observable parsingComplete = true;

  @computed get numAlignments() {
    return this.run.alignments.length;
  }

  // By default add empty sequences to fill gaps up to the union of taxons
  // else drop taxons that doesn't exist in all alignments by taking the intersection
  @observable fillTaxonGapsWithEmptySeqeunces = true;

  @action setFillTaxonGapsWithEmptySeqeunces = (checked) => {
    this.fillTaxonGapsWithEmptySeqeunces = checked;
  }

  @computed get taxons() {
    const setMethod = this.fillTaxonGapsWithEmptySeqeunces ? union : intersection;
    return setMethod.apply(setMethod, this.run.alignments.map(({ taxons }) => taxons));
  }

  @computed get numSequences() {
    return this.taxons.length;
  }

  @computed get length() {
    return this.run.alignments.reduce((sumLength, alignment) => sumLength + alignment.length, 0);
  }

  @computed get hasInvariantSites() {
    // If any one of the alignments has invariant sites return true
    for (let i = 0; i < this.numAlignments; i++) {
      if (this.run.alignments[i].hasInvariantSites) {
        return true;
      }
    }
    return false;
  }

  // @computed get dataType() {
  //   const numAlignments = this.numAlignments;
  //   if (numAlignments === 0) {
  //     return 'none';
  //   }
  //   const firstType = this.run.alignments[0].dataType;
  //   if (numAlignments === 1) {
  //     return firstType;
  //   }
  //   for (let i = 1; i < numAlignments; ++i) {
  //     if (this.run.alignments[i].dataType !== firstType) {
  //       return 'mixed';
  //     }
  //   }
  //   return firstType;
  // }


  @computed get dataType() {
    const { alignments } = this.run;
    const dataTypes = alignments.map(({ dataType }) => dataType);
    return getFinalDataType(dataTypes);
  }


  @computed get modelFlagName() {
    const numAlignments = this.numAlignments;
    if (numAlignments === 0) {
      return 'none';
    }
    const first = this.run.alignments[0].modelFlagName;
    if (numAlignments === 1) {
      return first;
    }
    return first;
  }

  @computed get partitionFilePath() {
    if (this.partition.isDefault) {
      return '';
    }
    const suffix = this.numAlignments > 1 ? '_concat' : '';
    return join(`${this.dir}`, `RAxML_${this.run.outputNameSafe}${suffix}.part.txt`);
  }

  @computed get partitionFileContent() {
    return this.partition.text;
  }

  @action
  openFile = async () => {
    await this.writeConcatenatedAlignment();
    ipcRenderer.send(ipc.FILE_OPEN, this.path);
  };

  @action
  openPartition = async () => {
    await this.writeConcatenatedAlignmentAndPartition();
    ipcRenderer.send(ipc.FILE_OPEN, this.partitionFilePath);
  };

  @action
  showFileInFolder = async () => {
    await this.writeConcatenatedAlignment();
    ipcRenderer.send(ipc.FILE_SHOW_IN_FOLDER, this.path);
  };

  @action
  openFolder = async () => {
    await this.writeConcatenatedAlignmentAndPartition();
    ipcRenderer.send(ipc.FOLDER_OPEN, this.dir);
  };

  @action
  writeConcatenatedAlignmentAndPartition = async () => {
    await this.writeConcatenatedAlignment();
    await this.writePartition();
  };

  @action
  writeConcatenatedAlignment = async () => {
    const { taxons, numSequences } = this;
    try {
      console.log(`Write concatenated alignment in FASTA format to ${this.path}..`);
      const writeStream = fs.createWriteStream(this.path);
      const write = util.promisify(writeStream.write);
      const end = util.promisify(writeStream.end);
      for (let i = 0; i < numSequences; ++i) {
        for (let j = 0; j < this.numAlignments; ++j) {
          if (j === 0) {
            const prefix = i === 0 ? '>' : '\n>';
            await write.call(writeStream, `${prefix}${taxons[i]}\n`);
          }
          await write.call(writeStream, this.run.alignments[j].getSequenceCode(taxons[i]));
        }
      }
      await end.call(writeStream);
    }
    catch (err) {
      console.error('Error writing concatenated alignment:', err);
      throw err;
    }
  };

  @action
  writePartition = async () => {
    try {
      console.log(`Writing partition to ${this.partitionFilePath}...`);
      await writeFile(this.partitionFilePath, this.partitionFileContent);
    }
    catch (err) {
      console.error('Error writing partition:', err);
      throw err;
    }
  }

}

export { Alignment as default, FinalAlignment };
