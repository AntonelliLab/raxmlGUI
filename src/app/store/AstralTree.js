import { action, makeObservable } from 'mobx';

import InputFile from './InputFile';

class AstralTree extends InputFile {
  constructor( ...args ) {
    super( ...args );
    makeObservable( this );
  }
  @action
    remove = () => {
      this.run.removeAstralTree();
    };
}

export default AstralTree;
