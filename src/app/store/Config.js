import { observable, action } from 'mobx';
import * as ipc from '../../constants/ipc';
import StoreBase from './StoreBase';
import Store from 'electron-store';

export const store = new Store();

export default class Config extends StoreBase {

  constructor() {
    super();
    this.listen();
  }

  @observable isDarkMode = store.get('darkMode')

  @action
  setDarkMode = value => {
    value = !!value;
    store.set('darkMode', value);
    this.isDarkMode = value;
  }

  onLightMode = () => {
    this.setDarkMode(false);
  }

  onDarkMode = () => {
    this.setDarkMode(true);
  }

  listen = () => {
    this.listenTo(ipc.LIGHT_MODE, this.onLightMode);
    this.listenTo(ipc.DARK_MODE, this.onDarkMode);
  }
}
