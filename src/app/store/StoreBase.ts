import { runInAction } from 'mobx';

import type { RendererBridge } from '../../common/rendererBridge';

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
  onUpdateDownload: 'onUpdateDownload',
} as const;

export default class StoreBase {
  eventStops: ( () => void )[] = [];

  version: string | undefined = undefined;

  constructor() {
    this._init();
  }

  subscribe = <K extends keyof typeof runEvents>(
    name: K,
    listener: Parameters<RendererBridge[K]>[0],
  ): void => {
    const { rendererBridge } = window;
    const on = rendererBridge[name] as ( l: typeof listener ) => () => void;
    this.eventStops.push( on( listener ) );
  };

  unlisten = (): void => {
    while ( this.eventStops.length ) {
      this.eventStops.pop()();
    }
  };

  // A method: a field here would clash with a subclass's dispose field.
  dispose(): void {
    this.unlisten();
  }

  _init = (): void => {
    const { rendererBridge } = window;
    rendererBridge.getVersion().then( ( version ) => {
      runInAction( () => {
        this.version = version;
      } );
    } );
  };
}
