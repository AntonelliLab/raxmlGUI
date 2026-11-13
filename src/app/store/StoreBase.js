import { ipcRenderer } from 'electron';

import * as ipc from '../../constants/ipc';

export const runEvents = {
  onRunStdout: 'onRunStdout',
  onRunStderr: 'onRunStderr',
  onRunFinished: 'onRunFinished',
  onRunError: 'onRunError',
  onAstralSuccess: 'onAstralSuccess',
  onAddRun: 'onAddRun',
  onRemoveRun: 'onRemoveRun',
  onLightMode: 'onLightMode',
  onDarkMode: 'onDarkMode',
  onToggleBackboneConstraint: 'onToggleBackboneConstraint',
  onToggleMultifurcatingConstraint: 'onToggleMultifurcatingConstraint',
  onUnhandledError: 'onUnhandledError',
};

export default class StoreBase {
  listeners = [];
  eventStops = [];

  constructor() {
    this._init();
    this._listen();
  }

  listenTo = ( channel, listener ) => {
    ipcRenderer.on( channel, listener );
    this.listeners.push( [channel, listener] );
  };

  subscribe = ( name, listener ) => {
    const { rendererBridge } = /** @type {any} */ ( window );
    this.eventStops.push( rendererBridge[name]( listener ) );
  };

  unlisten = () => {
    while ( this.eventStops.length ) {
      this.eventStops.pop()();
    }
    while ( !this.listeners.length > 0 ) {
      const [channel, listener] = this.listeners.pop();
      ipcRenderer.removeListener( channel, listener );
    }
  };

  dispose = () => {
    this.unlisten();
  };

  _init = () => {
    ipcRenderer.send( ipc.INIT_APP_STATE );
  };

  _listen = () => {
    this.listenTo( ipc.INIT_APP_STATE_RECEIVED, this._initAppState );
  };

  _initAppState = ( event, { version } ) => {
    this.version = version;
  };
}
