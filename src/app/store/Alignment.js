import { observable, computed, action, runInAction } from 'mobx';
import { ipcRenderer } from 'electron';
import * as ipc from '../../constants/ipc';
import parsePath from 'parse-filepath';
import * as raxmlSettings from '../../settings/raxml';
import { join } from 'path';
import fs from 'fs';
import util from 'util';
import union from 'lodash/union';
import intersection from 'lodash/intersection';

const writeFile = util.promisify(fs.writeFile);

const modelOptions = {
  'protein': raxmlSettings.aminoAcidSubstitutionModelOptions,
  'binary': raxmlSettings.binarySubstitutionModelOptions,
  'mixed': raxmlSettings.mixedSubstitutionModelOptions,
  'multistate': raxmlSettings.multistateSubstitutionModelOptions,
  'dna': raxmlSettings.nucleotideSubstitutionModelOptions,
  'rna': raxmlSettings.nucleotideSubstitutionModelOptions,
  'ambiguousDna': raxmlSettings.nucleotideSubstitutionModelOptions,
  'ambiguousRna': raxmlSettings.nucleotideSubstitutionModelOptions,
};

class Alignment {
  run = null;
  @observable path = '';
  @observable error = null;

  @observable dataType = undefined;
  @observable model = '';
  @observable aaMatrixName = raxmlSettings.aminoAcidSubstitutionMatrixOptions.default;
  @computed get modelFlagName() {
    let name = this.model;
    if (this.dataType === 'protein')  {
      name += this.aaMatrixName;
    }
    return name;
  }

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


  // TODO: This should change all other multistate models if available, according to documentation:
  // If you have several partitions that consist of multi-state characters the model specified via -K will be applied to all models. Thus, it is not possible to assign different models to distinct multi-state partitions!
  @observable multistateModel = raxmlSettings.kMultistateSubstitutionModelOptions.default;

  // Partition stuff
  @observable showPartition = false;
  @observable partitionText = "";
  @computed get partitionType() {
    switch (this.dataType) {
      case 'dna':
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

  // @computed
  // get loading() {
  //   return !this.checkRunComplete;
  // }

  @computed
  get modelOptions() {
    if (!this.dataType) {
      return [];
    }
    return modelOptions[this.dataType].options;
  }

  @computed
  get modelExtra() {
    switch (this.dataType) {
      case 'protein':
        return {
          label: 'Matrix name',
          options: raxmlSettings.aminoAcidSubstitutionMatrixOptions.options,
          value: this.aaMatrixName,
          onChange: this.onChangeAAMatrixName,
        };
      case 'multistate':
        return {
          label: 'Multistate model',
          options: raxmlSettings.kMultistateSubstitutionModelOptions.options,
          value: this.multistateModel,
          onChange: this.onChangeMultistateModel,
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
          runInAction(() => {
            this.sequences = alignment.sequences;
            this.fileFormat = alignment.fileFormat;
            this.numSequences = alignment.numSequences;
            this.length = alignment.length;
            this.parsingComplete = true;
            this.numSequencesParsed = this.numSequences;
            this.dataType = alignment.dataType;
            this.typecheckingComplete = alignment.typecheckingComplete;
            this.model = modelOptions[alignment.dataType].default;
            this.loading = false;
          });
        };
    });
    ipcRenderer.on(ipc.ALIGNMENT_PARSE_FAILURE, (event, { id, error }) => {
        if (id === this.id) {
          runInAction(() => {
            this.error = error;
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

  @action
  onChangeMultistateModel = (event) => {
    console.log('onChangeMultistateModel');
    this.multistateModel = event.target.value;
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
