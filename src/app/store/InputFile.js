import { observable, computed, action, makeObservable } from 'mobx';

import { base, dir, name } from '../paths';
import StoreBase from './StoreBase';

class InputFile extends StoreBase {
  run = null;

  constructor( run, path ) {
    super();
    makeObservable( this, {
      path: observable,
      id: computed,
      name: computed,
      dir: computed,
      base: computed,
      filename: computed,
      ok: computed,
      openFile: action,
      showFileInFolder: action,
    } );
    this.run = run;
    this.path = path;
  }

  // Observable because it may change on correcting errors or reformating of alignments
  path = '';

  get id() {
    return `${this.run.id}_${this.path}`;
  }

  get name() {
    return name( this.path );
  }

  get dir() {
    return dir( this.path );
  }

  get base() {
    return base( this.path );
  }

  get filename() {
    return base( this.path );
  }

  get ok() {
    return this.path !== '';
  }

  openFile = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( this.path );
  };

  showFileInFolder = async () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.showItemInFolder( this.path );
  };
}

export default InputFile;
