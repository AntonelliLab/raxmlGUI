import { ipcRenderer } from 'electron';
import { observable } from 'mobx';

import * as ipc from '../../constants/ipc';

export default class StoreBase {
  listeners = [];

  @observable version = undefined;

  constructor() {
    this._init();
    this._listen();
  }

  listenTo = (channel, listener) => {
    ipcRenderer.on(channel, listener);
    this.listeners.push([channel, listener]);
  };

  unlisten = () => {
    while (!this.listeners.length > 0) {
      const [channel, listener] = this.listeners.pop();
      ipcRenderer.removeListener(channel, listener);
    }
  };

  dispose = () => {
    this.unlisten();
  };

  _init = () => {
    ipcRenderer.send(ipc.INIT_APP_STATE);
  };

  _listen = () => {
    this.listenTo(ipc.INIT_APP_STATE_RECEIVED, this._initAppState);
  };

  _initAppState = (event, { version }) => {
    console.log('version :>> ', version);
    this.version = version;
  };
}
