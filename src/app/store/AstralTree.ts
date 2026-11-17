import { action, makeObservable } from 'mobx';

import InputFile from './InputFile';

interface AstralTreeOwner {
  id: number;
  removeAstralTree: () => void;
}

class AstralTree extends InputFile<AstralTreeOwner> {
  constructor( run: AstralTreeOwner, path: string ) {
    super( run, path );
    makeObservable( this, { remove: action } );
  }
  remove = (): void => {
    this.run.removeAstralTree();
  };
}

export default AstralTree;
