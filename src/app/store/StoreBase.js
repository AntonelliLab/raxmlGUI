import { ipcRenderer } from 'electron';

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
};

export default class StoreBase {
  listeners = [];
  eventStops = [];

  constructor() {
    this._init();
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
    while ( this.listeners.length > 0 ) {
      const [channel, listener] = this.listeners.pop();
      ipcRenderer.removeListener( channel, listener );
    }
  };

  dispose = () => {
    this.unlisten();
  };

  _init = () => {
    const { rendererBridge } = /** @type {any} */ ( window );
    rendererBridge.getVersion().then( ( version ) => {
      this.version = version;
    } );
  };
}
