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
    const { rendererBridge } = window;
    rendererBridge.getDarkMode().then( ( value ) => {
      runInAction( () => {
        this.isDarkMode = !!value;
      } );
    } );
  }

  isDarkMode = false;

  setDarkMode = ( value: boolean ): void => {
    value = !!value;
    this.isDarkMode = value;
    const { rendererBridge } = window;
    void rendererBridge.setDarkMode( value );
  };

  onLightMode = (): void => {
    this.setDarkMode( false );
  };

  onDarkMode = (): void => {
    this.setDarkMode( true );
  };

  listen = (): void => {
    this.subscribe( runEvents.onLightMode, this.onLightMode );
    this.subscribe( runEvents.onDarkMode, this.onDarkMode );
  };
}
