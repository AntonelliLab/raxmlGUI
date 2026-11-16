import { observable, action, makeObservable } from 'mobx';
import StoreBase from './StoreBase';
import Citation from './Citation';
import Config from './Config';

class AppStore extends StoreBase {
  constructor() {
    super();
    makeObservable( this, {
      version: observable,
      showAppSnack: observable,
      setAppSnack: action,
      clearAppSnack: action,
    } );
  }
  citation = new Citation();
  config = new Config();

  version = undefined;

  showAppSnack = false;

  setAppSnack = () => {
    this.showAppSnack = true;
  };

  clearAppSnack = () => {
    this.showAppSnack = false;
  };
}

export default AppStore;
