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
  @computed get notAvailable() { return !this.alignment.run.haveAlignments || this.alignment.run.alignments.length === 1; }
  @computed get cmdValue() {
    let model = this.value;
    if (this.alignment.dataType === 'multistate') {
      model = model.replace('x', this.alignment.multistateNumber.value);
    }
    return model;
  }
}

class MultistateNumber extends Option {
  constructor(alignment) {
    super(alignment.run, '', 'Number of states');
    this.alignment = alignment;
    this.placeholder = 'Integer';
  }
  @computed get notAvailable() { return this.alignment.run.alignments.length === 1 || this.alignment.dataType !== 'multistate' || !this.alignment.run.usesRaxmlNg; }
  @computed get error() { return !this.value || !Number.isInteger(Number(this.value)) }
}

class Alignment {
  run = null;

  substitutionModel = new RaxmlNgAlignmentSubstitutionModel(this);
  multistateNumber = new MultistateNumber(this);

  @observable path = '';
  @observable error = null;

  @observable dataType = undefined;
  @observable aaMatrixName = raxmlSettings.aminoAcidSubstitutionMatrixOptions.default;

  @observable size = 0;
  @observable fileFormat = undefined;
  @observable length = 0;
  @observable numSequences = 0;
  @observable sequences = [];

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
  @observable showPartition = false;
  @observable partitionText = "";
  @computed get partitionType() {
    if (this.run.usesRaxmlNg) {
      return this.substitutionModel.cmdValue;
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

  constructor(run, path) {
    this.run = run;
    this.path = path;
    this.listen();
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
          onChange: this.onChangeAAMatrixName,
        };
      default:
        return null;
    }
  }


  listen = () => {
    // Send alignments to main process for processing
    ipcRenderer.send(ipc.ALIGNMENT_PARSE_REQUEST, { id: this.id, filePath: this.path });
    // Listener taken from processAlignments()
    // Receive a progress update for one of the alignments being parsed
    ipcRenderer.on(ipc.ALIGNMENT_PARSE_SUCCESS, (event, { id, alignment }) => {
        if (id === this.id) {
          if (alignment.dataType !== this.run.dataType) {
            this.run.substitutionModel.value = this.run.usesRaxmlNg ? raxmlNgModelOptions[alignment.dataType].default : raxmlModelOptions[alignment.dataType].default;
            // When the alignment has finished processing take the default ubstitution model for this datatype
            this.substitutionModel.value = raxmlNgModelOptions[alignment.dataType].default;
          }
          runInAction(() => {
            this.sequences = alignment.sequences;
            this.fileFormat = alignment.fileFormat;
            this.numSequences = alignment.numSequences;
            this.length = alignment.length;
            this.parsingComplete = true;
            this.numSequencesParsed = this.numSequences;
            this.dataType = alignment.dataType;
            this.typecheckingComplete = alignment.typecheckingComplete;
            this.loading = false;
          });
        };
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
        };
    });
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
  setShowPartition = (value = true) => {
    this.showPartition = value;
  }

  @action
  setPartitionText = (value) => {
    this.partitionText = value;
  }

  @action
  dispose = () => {
    //TODO: Remove listeners (make callbacks class methods to be able to remove them)
  }

  @action
  remove = () => {
    this.run.removeAlignment(this);
  };

  @action
  onChangeModel = (event) => {
    console.log('onChangeModel');
    this.model = event.target.value;
  }

  @action
  onChangeAAMatrixName = (event) => {
    console.log('onChangeAAMatrixName');
    this.aaMatrixName = event.target.value;
  }

  getSequenceCode = (taxon) => {
    // TODO: Sort sequences on taxon for quicker search, intersection and union
    const seq = this.sequences.find(seq => seq.taxon === taxon);
    if (seq !== undefined) {
      return seq.code;
    }
    return '-'.repeat(this.length);
  }
}


class FinalAlignment {
  constructor(run) {
    this.run = run;
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

  // @observable dataType = 'mixed';
  @computed get dataType() {
    const numAlignments = this.numAlignments;
    if (numAlignments === 0) {
      return 'none';
    }
    const firstType = this.run.alignments[0].dataType;
    if (numAlignments === 1) {
      return firstType;
    }
    for (let i = 1; i < numAlignments; ++i) {
      if (this.run.alignments[i].dataType !== firstType) {
        return 'mixed';
      }
    }
    return firstType;
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
    const numAlignments = this.numAlignments;
    if (numAlignments <= 1) {
      return '';
    }
    return join(`${this.dir}`, `RAxML_${this.run.outputNameSafe}_concat.part.txt`);
  }

  @computed get partitionFileContent() {
    /*
      DNA, gene1 = 1-3676
      BIN, morph = 3677-3851
    */
    if (!this.run.haveAlignments) {
      return '';
    }
    let partitionFileText = '';
    let site = 1;
    let total = 0;
    this.run.alignments.map((alignment, index) => {
      total += alignment.length;
      const { partitionType } = alignment;
      partitionFileText += `${partitionType}, ${alignment.dataType}_${index} = ${site}-${total}\n`;
      site += alignment.length;
      return { partitionType, dataType: alignment.dataType, length: alignment.length };
    });
    return partitionFileText;
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
