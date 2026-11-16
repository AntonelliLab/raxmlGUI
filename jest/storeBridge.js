// @ts-nocheck — Jest helper. checkJs has no jsdom bridge type.
import { autorun } from 'mobx';

import { runEvents } from '../src/app/store/StoreBase';

// Installs a renderer bridge whose run events record their listeners; `extra` adds or overrides methods.
// `listeners[name]` always holds the live subscribers, and `fire` calls them.
export function stubBridge( extra = {} ) {
  const listeners = {};
  const bridge = { ...extra };
  for ( const name of Object.values( runEvents ) ) {
    bridge[name] = ( listener ) => {
      ( listeners[name] ||= [] ).push( listener );
      return () => {
        listeners[name] = listeners[name].filter( ( l ) => l !== listener );
      };
    };
  }
  window.rendererBridge = bridge;
  const fire = ( name, payload ) =>
    ( listeners[name] || [] ).forEach( ( listener ) => listener( payload ) );
  return { bridge, listeners, fire };
}

// Records every value a reaction sees, so a test can prove it re-ran.
export function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}
