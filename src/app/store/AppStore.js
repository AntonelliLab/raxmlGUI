import { observable, computed, action } from 'mobx';
import StoreBase from './StoreBase';
import Citation from './Citation';
import Config from './Config';

class AppStore extends StoreBase {
  citation = new Citation();
  config = new Config();

  @observable version = undefined;

  @observable showAppSnack = false;

  @action setAppSnack = () => {
    this.showAppSnack = true;
  };

  @action clearAppSnack = () => {
    this.showAppSnack = false;
  };

  constructor() {
    super();
  }
}

export default AppStore;
