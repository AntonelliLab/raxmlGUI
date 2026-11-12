import { observable, computed, action } from 'mobx';
import { ipcRenderer } from 'electron';

import * as ipc from '../../constants/ipc';
import { base, dir, name } from '../paths';
import StoreBase from './StoreBase';

class InputFile extends StoreBase {
  run = null;

  constructor( run, path ) {
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
    return name( this.path );
  }

  @computed
  get dir() {
    return dir( this.path );
  }

  @computed
  get base() {
    return base( this.path );
  }

  @computed
  get filename() {
    return base( this.path );
  }

  @computed
  get ok() {
    return this.path !== '';
  }

  @action
    openFile = () => {
      ipcRenderer.send( ipc.FILE_OPEN, this.path );
    };

  @action
    showFileInFolder = async () => {
      const { rendererBridge } = /** @type {any} */ ( window );
      await rendererBridge.showItemInFolder( this.path );
    };
}

export default InputFile;
