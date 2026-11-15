import { observable, action, runInAction, makeObservable } from 'mobx';
import StoreBase, { runEvents } from './StoreBase';

export default class Config extends StoreBase {
  constructor() {
    super();
    makeObservable( this, {
      isDarkMode: observable,
      setDarkMode: action,
    } );
    this.listen();
    const { rendererBridge } = /** @type {any} */ ( window );
    rendererBridge.getDarkMode().then( ( value ) => {
      runInAction( () => {
        this.isDarkMode = !!value;
      } );
    } );
  }

  isDarkMode = false;

  setDarkMode = ( value ) => {
    value = !!value;
    this.isDarkMode = value;
    const { rendererBridge } = /** @type {any} */ ( window );
    void rendererBridge.setDarkMode( value );
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
