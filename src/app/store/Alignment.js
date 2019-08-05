import { observable, computed, action, runInAction } from 'mobx';
import ipcRenderer from '../ipcRenderer';
import * as ipc from '../../constants/ipc';
import parsePath from 'parse-filepath';
import { runSettings } from '../../settings/run';
import { join } from 'path';

const modelOptions = {
  'protein': runSettings.aminoAcidSubstitutionModelOptions,
  'binary': runSettings.binarySubstitutionModelOptions,
  'mixed': runSettings.mixedSubstitutionModelOptions,
  'multistate': runSettings.multistateSubstitutionModelOptions,
  'dna': runSettings.nucleotideSubstitutionModelOptions,
  'rna': runSettings.nucleotideSubstitutionModelOptions,
  'ambiguousDna': runSettings.nucleotideSubstitutionModelOptions,
  'ambiguousRna': runSettings.nucleotideSubstitutionModelOptions,
};

class Alignment {
  run = null;
  @observable path = '';
  @observable dataType = undefined;
  @observable model = '';
  @observable aaMatrixName = runSettings.aminoAcidSubstitutionMatrixOptions.default;
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
  @observable parsingComplete = false;
  @observable typecheckingComplete = false;
  @observable checkRunComplete = false;
  @observable checkRunData = '';
  @observable checkRunSuccess = false;
  @observable sequences = undefined;
  // @observable taxons = [];


  // TODO: This should change all other multistate models if available, according to documentation:
  // If you have several partitions that consist of multi-state characters the model specified via -K will be applied to all models. Thus, it is not possible to assign different models to distinct multi-state partitions!
  @observable multistateModel = runSettings.kMultistateSubstitutionModelOptions.default;

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
    return this.path;
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
  get loading() {
    return !this.checkRunComplete;
  }

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
          options: runSettings.aminoAcidSubstitutionMatrixOptions.options,
          value: this.aaMatrixName,
          onChange: this.onChangeAAMatrixName,
        };
      case 'multistate':
        return {
          label: 'Multistate model',
          options: runSettings.kMultistateSubstitutionModelOptions.options,
          value: this.multistateModel,
          onChange: this.onChangeMultistateModel,
        };
      default:
        return null;
    }
  }

  @computed get taxons() {
    return (this.sequences || []).map(seq => seq.id);
  }


  listen = () => {
    // Send alignments to main process for processing
    ipcRenderer.send(ipc.ALIGNMENT_ADDED_IPC, this.path);
    // Listener taken from processAlignments()
    // Receive a progress update for one of the alignments being parsed
    ipcRenderer.on(ipc.PARSING_PROGRESS_IPC, (event, { alignment, numSequencesParsed }) => {
        if (alignment.path === this.path) {
          this.numSequencesParsed = numSequencesParsed;
        };
      }
    );

    // Receive update that one alignment has completed parsing
    ipcRenderer.on(ipc.PARSING_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        runInAction(() => {
          this.sequences = alignment.sequences;
          this.fileFormat = alignment.fileFormat;
          this.numSequences = alignment.numSequences;
          this.length = alignment.length;
          this.parsingComplete = alignment.parsingComplete;
        });
      };
    });

    // Receive update that the parsing of one alignment has failed
    ipcRenderer.on(ipc.PARSING_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.error = error;
        this.parsingComplete = alignment.parsingComplete;
      };
    });

    // Receive a progress update for one of the alignments being typechecked
    ipcRenderer.on(ipc.TYPECHECKING_PROGRESS_IPC, (event, { alignment, numSequencesTypechecked }) => {
        if (alignment.path === this.path) {
          runInAction(() => {
            this.numSequencesTypechecked = numSequencesTypechecked;
          });
        };
      }
    );

    // Receive update that one alignment has completed typechecking
    ipcRenderer.on(ipc.TYPECHECKING_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        runInAction(() => {
          this.dataType = alignment.dataType;
          this.typecheckingComplete = alignment.typecheckingComplete;
          this.model = modelOptions[alignment.dataType].default;
        });
      };
    });

    // Receive update that the typechecking of one alignment has failed
    ipcRenderer.on(ipc.TYPECHECKING_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.error = error;
        this.typecheckingComplete = alignment.typecheckingComplete;
      };
    });

    // Receive update that one alignment has completed the checkrun
    ipcRenderer.on(ipc.CHECKRUN_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        runInAction(() => {
          this.checkRunComplete = alignment.checkRunComplete;
          this.checkRunSuccess = alignment.checkRunSuccess;
        })
      };
    });

    // Receive update that the checkrun of one alignment has failed
    ipcRenderer.on(ipc.CHECKRUN_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.error = error;
        this.checkRunComplete = alignment.checkRunComplete;
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
}


class FinalAlignment {
  constructor(run) {
    this.run = run;
  }

  @computed get filename() {
    if (this.numAlignments === 1) {
      return this.run.alignments[0].filename;
    }
    return `${this.run.outputNameSafe}_concat.txt`;
  }

  @computed get dir() {
    return this.run.outputDir;
  }

  @computed get path() {
    return join(`${this.dir}`, `${this.filename}`);
  }

  @observable parsingComplete = true;

  @computed get numAlignments() {
    return this.run.alignments.length;
  }

  @computed get numSequences() {
    return this.run.alignments.reduce((a, b) => Math.max(a.numSequences, b.numSequences));
  }

  @computed get length() {
    return this.run.alignments.reduce((a, b) => a.length + b.length);
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
    return join(`${this.dir}`, `${this.run.outputNameSafe}_concat.part.txt`);
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
  openFile = () => {
    ipcRenderer.send(ipc.FILE_OPEN, this.path);
  };

  @action
  showFileInFolder = () => {
    ipcRenderer.send(ipc.FILE_SHOW_IN_FOLDER, this.path);
  };

  @action
  openFolder = () => {
    ipcRenderer.send(ipc.FOLDER_OPEN, this.dir);
  };

}

export { Alignment as default, FinalAlignment };
