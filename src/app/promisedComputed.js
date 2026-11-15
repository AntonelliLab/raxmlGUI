import { computed, makeObservable, _getGlobalState } from 'mobx';
import { fromPromise, isPromiseBasedObservable } from 'mobx-utils';

const ok = ( value ) => ( { ok: true, value } );
const failed = ( error ) => ( { ok: false, error } );

// Replaces computed-async-mobx: its 7.0 build mixes decorators with annotations, which MobX 6 rejects.
// Like a computed that unwraps a promise: `init` until the first resolve, then the latest resolved value.
// `get` must run inside a reaction; `busy` is true while the promise is pending.
class PromisedComputed {
  constructor( init, fetch ) {
    this.fetch = fetch;
    this.cached = ok( init );
    makeObservable( this, {
      currentState: computed,
      busy: computed,
      value: computed,
    } );
  }

  get currentState() {
    try {
      const promiseOrValue = this.fetch();
      return typeof promiseOrValue?.then === 'function'
        ? fromPromise( promiseOrValue.then( ok, failed ) )
        : ok( promiseOrValue );
    } catch ( err ) {
      return failed( err );
    }
  }

  get busy() {
    const state = this.currentState;
    return isPromiseBasedObservable( state ) && state.state === 'pending';
  }

  get value() {
    const state = this.currentState;
    const result = !isPromiseBasedObservable( state )
      ? state
      : state.state === 'fulfilled'
        ? state.value
        : this.cached;
    this.cached = result;
    if ( result.ok ) {
      return result.value;
    }
    throw result.error;
  }

  get() {
    if ( !_getGlobalState().trackingDerivation ) {
      throw new Error( 'promisedComputed must be used inside reactions' );
    }
    return this.value;
  }
}

export const promisedComputed = ( init, fetch ) => new PromisedComputed( init, fetch );
