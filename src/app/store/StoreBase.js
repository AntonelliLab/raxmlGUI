export const runEvents = {
  onRunStdout: 'onRunStdout',
  onRunStderr: 'onRunStderr',
  onRunFinished: 'onRunFinished',
  onRunError: 'onRunError',
  onAstralSuccess: 'onAstralSuccess',
  onModelSelectionSuccess: 'onModelSelectionSuccess',
  onModelSelectionFailure: 'onModelSelectionFailure',
  onAddRun: 'onAddRun',
  onRemoveRun: 'onRemoveRun',
  onLightMode: 'onLightMode',
  onDarkMode: 'onDarkMode',
  onToggleBackboneConstraint: 'onToggleBackboneConstraint',
  onToggleMultifurcatingConstraint: 'onToggleMultifurcatingConstraint',
  onUnhandledError: 'onUnhandledError',
};

export default class StoreBase {
  eventStops = [];

  constructor() {
    this._init();
  }

  subscribe = ( name, listener ) => {
    const { rendererBridge } = /** @type {any} */ ( window );
    this.eventStops.push( rendererBridge[name]( listener ) );
  };

  unlisten = () => {
    while ( this.eventStops.length ) {
      this.eventStops.pop()();
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
