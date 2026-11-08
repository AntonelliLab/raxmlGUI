import { action,observable } from 'mobx';

import Citation from './Citation';
import Config from './Config';
import StoreBase from './StoreBase';

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
}

export default AppStore;
