import { observable, computed, action, runInAction } from 'mobx';

import InputFile from './InputFile';


class AstralTree extends InputFile {
  constructor(run, path) {
    super(run, path);
  }

  @action
  remove = () => {
    this.run.removeAstralTree();
  };
}

export default AstralTree;