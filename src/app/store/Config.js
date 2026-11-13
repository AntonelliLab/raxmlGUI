import { observable, action, runInAction } from 'mobx';
import StoreBase, { runEvents } from './StoreBase';

export default class Config extends StoreBase {
  constructor() {
    super();
    this.listen();
    const { rendererBridge } = /** @type {any} */ ( window );
    rendererBridge.getDarkMode().then( ( value ) => {
      runInAction( () => {
        this.isDarkMode = !!value;
      } );
    } );
  }

  @observable isDarkMode = false;

  @action
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
