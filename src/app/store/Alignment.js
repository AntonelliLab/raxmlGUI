import { observable, computed, action, runInAction, toJS } from 'mobx';
import ipcRenderer from '../ipcRenderer';
import * as ipc from '../../constants/ipc';
import parsePath from 'parse-filepath';
import { runSettings } from '../../settings/run';

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
  @observable size = 0;
  @observable dataType = undefined;
  @observable fileFormat = undefined;
  @observable length = 0;
  @observable numSequences = 0;
  @observable parsingComplete = false;
  @observable typecheckingComplete = false;
  @observable checkRunComplete = false;
  @observable checkRunData = '';
  @observable checkRunSuccess = false;
  @observable sequences = undefined;
  @observable model = '';
  @observable aaMatrixName = runSettings.aminoAcidSubstitutionMatrixOptions.default;
  // TODO: This should change all other multistate models if available, according to documentation:
  // If you have several partitions that consist of multi-state characters the model specified via -K will be applied to all models. Thus, it is not possible to assign different models to distinct multi-state partitions!
  @observable multistateModel = runSettings.kMultistateSubstitutionModelOptions.default;

  // Partition stuff
  @observable showPartition = false;
  @observable partitionText = "";

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
  openFolder = () => {
    ipcRenderer.send(ipc.FOLDER_OPEN_IPC, this.path);
  };

  @action
  openFile = () => {
    ipcRenderer.send(ipc.FILE_OPEN_IPC, this.path);
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

export default Alignment;
