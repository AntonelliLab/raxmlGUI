import { observable, computed, action, makeObservable } from 'mobx';
import type { StateReport } from '../../main/getActiveState';
import Run from './Run';
import AppStore from './AppStore';
import { runEvents } from './StoreBase';

class RunList extends AppStore {
  runs: Run[] = [];
  activeIndex = 0;

  constructor() {
    super();
    makeObservable( this, {
      runs: observable,
      activeIndex: observable,
      error: observable,
      errorTitle: observable,
      clearError: action,
      activeRun: computed,
      addRun: action,
      deleteRun: action,
      setActive: action,
      deleteActive: action,
      onError: action,
      onUnhandledError: action,
      onBackboneConstraint: action,
      onMultifurcatingConstraint: action,
    } );
    this.addRun();
    this.listen();
  }

  error: unknown = null;
  errorTitle: string | null = null;
  clearError = (): void => {
    this.error = null;
    this.errorTitle = null;
  };

  get activeRun(): Run {
    return this.runs[this.activeIndex];
  }

  addRun = (): void => {
    let maxId = 0;
    this.runs.forEach( ( run: Run ) => ( maxId = Math.max( run.id, maxId ) ) );
    this.runs.push( new Run( this, maxId + 1 ) );
    this.activeIndex = this.runs.length - 1;
  };

  deleteRun = ( run: Run ): void => {
    run.dispose();
    const runIndex = this.runs.findIndex( ( m: Run ) => m.id === run.id );
    this.runs.splice( runIndex, 1 );
    if ( this.runs.length === 0 ) {
      this.runs.push( new Run( this, 1 ) );
    }
    this.activeIndex = Math.min( this.runs.length - 1, this.activeIndex );
  };

  setActive = ( index: number ): void => {
    this.activeIndex = index;
  };

  deleteActive = (): void => {
    this.deleteRun( this.activeRun );
  };

  onError = ( error: unknown ): void => {
    this.errorTitle = null;
    this.error = error;
  };

  onUnhandledError = ( { title, error }: { title: string; error: unknown } ): void => {
    console.log( 'Unhandled error:', error );
    this.errorTitle = title;
    this.error = error;
  };

  onBackboneConstraint = (): void => {
    this.activeRun.useBackboneConstraint =
      !this.activeRun.useBackboneConstraint;
  };

  onMultifurcatingConstraint = (): void => {
    this.activeRun.useMultifurcatingConstraint =
      !this.activeRun.useMultifurcatingConstraint;
  };

  listen = (): void => {
    this.subscribe( runEvents.onUnhandledError, this.onUnhandledError );
    this.subscribe( runEvents.onAddRun, this.addRun );
    this.subscribe( runEvents.onRemoveRun, this.deleteActive );
    this.subscribe( runEvents.onToggleBackboneConstraint, this.onBackboneConstraint );
    this.subscribe(
      runEvents.onToggleMultifurcatingConstraint,
      this.onMultifurcatingConstraint,
    );
  };

  generateReport = ( { maxStdoutLength = 1000 } = {} ): StateReport => {
    return this.activeRun.generateReport( { maxStdoutLength } );
  };
}

export default RunList;
