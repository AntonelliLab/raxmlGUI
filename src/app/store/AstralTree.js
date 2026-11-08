import { action } from 'mobx';

import InputFile from './InputFile';

class AstralTree extends InputFile {
  @action
    remove = () => {
      this.run.removeAstralTree();
    };
}

export default AstralTree;
