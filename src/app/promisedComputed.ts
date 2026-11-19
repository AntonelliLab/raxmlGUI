import { computed, makeObservable } from 'mobx';
import { fromPromise } from 'mobx-utils';
import type { IPromiseBasedObservable } from 'mobx-utils';

// Replaces computed-async-mobx: its 7.0 build mixes decorators with annotations, which MobX 6 rejects.
// Like a computed that unwraps a promise: `init` until the first resolve, then the latest resolved value.
// Read it inside a reaction: outside one, every read re-runs `fetch` and returns `init`.
class PromisedComputed<T> {
  fetch: () => Promise<T>;

  cached: Partial<T>;

  constructor( init: Partial<T>, fetch: () => Promise<T> ) {
    this.fetch = fetch;
    this.cached = init;
    makeObservable( this, {
      currentState: computed,
      value: computed,
    } );
  }

  // fetch must return a promise (the only caller is async)
  get currentState(): IPromiseBasedObservable<T> {
    return fromPromise( this.fetch() );
  }

  get value(): T {
    const state = this.currentState;
    if ( state.state === 'rejected' ) {
      throw state.value;
    }
    if ( state.state === 'fulfilled' ) {
      this.cached = state.value;
    }
    return this.cached as T; // init is a partial placeholder until the first resolve
  }

  get(): T {
    return this.value;
  }
}

export const promisedComputed = <T>(
  init: Partial<T>,
  fetch: () => Promise<T>,
): PromisedComputed<T> => new PromisedComputed( init, fetch );
