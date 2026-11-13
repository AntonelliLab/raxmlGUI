import { observable, action } from 'mobx';
import StoreBase, { runEvents } from './StoreBase';

function readDarkMode() {
  return window.localStorage.getItem( 'darkMode' ) === 'true';
}

export default class Config extends StoreBase {
  constructor() {
    super();
    this.listen();
  }

  @observable isDarkMode = readDarkMode();

  @action
    setDarkMode = ( value ) => {
      value = !!value;
      window.localStorage.setItem( 'darkMode', value
        ? 'true'
        : 'false' );
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
