import { observable, computed, action, makeObservable } from 'mobx';

import { base, dir, name } from '../paths';
import StoreBase from './StoreBase';

interface InputFileOwner {
  id: number;
}

class InputFile<Owner extends InputFileOwner = InputFileOwner> extends StoreBase {
  run: Owner;

  constructor( run: Owner, path: string ) {
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

  get id(): string {
    return `${this.run.id}_${this.path}`;
  }

  get name(): string {
    return name( this.path );
  }

  get dir(): string {
    return dir( this.path );
  }

  get base(): string {
    return base( this.path );
  }

  get filename(): string {
    return base( this.path );
  }

  get ok(): boolean {
    return this.path !== '';
  }

  openFile = async (): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.openPath( this.path );
  };

  showFileInFolder = async (): Promise<void> => {
    const { rendererBridge } = window;
    await rendererBridge.showItemInFolder( this.path );
  };
}

export default InputFile;
