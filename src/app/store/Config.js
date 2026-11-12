import { observable, action } from 'mobx';
import StoreBase, { runEvents } from './StoreBase';
import Store from 'electron-store';

export const store = new Store();

export default class Config extends StoreBase {
  constructor() {
    super();
    this.listen();
  }

  @observable isDarkMode = store.get( 'darkMode' );

  @action
    setDarkMode = ( value ) => {
      value = !!value;
      store.set( 'darkMode', value );
      this.isDarkMode = value;
    };

  onLightMode = () => {
    this.setDarkMode( false );
  };

  onDarkMode = () => {
    this.setDarkMode( true );
  };

  listen = () => {
    this.subscribe( runEvents.onLightMode, this.onLightMode );
    this.subscribe( runEvents.onDarkMode, this.onDarkMode );
  };
}
