import { observable, computed, action, runInAction } from 'mobx';
import { ipcRenderer } from 'electron';
import parsePath from 'parse-filepath';

import * as ipc from '../../constants/ipc';
import StoreBase from './StoreBase';

class InputFile extends StoreBase {
  run = null;

  constructor(run, path) {
    super();
    this.run = run;
    this.path = path;
  }

  // Observable because it may change on correcting errors or reformating of alignments
  @observable path = '';

  @computed
  get id() {
    return `${this.run.id}_${this.path}`;
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

  @action
  openFile = () => {
    ipcRenderer.send(ipc.FILE_OPEN, this.path);
  };

  @action
  showFileInFolder = () => {
    ipcRenderer.send(ipc.FILE_SHOW_IN_FOLDER, this.path);
  };
}

export default InputFile;