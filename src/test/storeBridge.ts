import { autorun } from 'mobx';

import { runEvents } from '../app/store/StoreBase';
import type { RendererBridge } from '../common/rendererBridge';

import { installBridge } from './setup';

type RunEventName = keyof typeof runEvents;
// Every bridge listener fits this, whatever payload its event carries.
type Listener = ( payload: never ) => void;

interface StubbedBridge {
  bridge: RendererBridge;
  listeners: Partial<Record<RunEventName, Listener[]>>;
  fire: ( name: RunEventName, payload?: unknown ) => void;
}

// Installs a renderer bridge whose run events record their listeners; `extra` adds or overrides methods.
// `listeners[name]` always holds the live subscribers, and `fire` calls them.
export function stubBridge( extra: Partial<RendererBridge> = {} ): StubbedBridge {
  const listeners: StubbedBridge['listeners'] = {};
  const events: Partial<RendererBridge> = {};
  for ( const name of Object.values( runEvents ) as RunEventName[] ) {
    events[name] = ( listener: Listener ) => {
      ( listeners[name] ||= [] ).push( listener );
      return () => {
        listeners[name] = listeners[name]!.filter( ( l ) => l !== listener );
      };
    };
  }
  installBridge( extra );
  const bridge = installBridge( events );
  const fire: StubbedBridge['fire'] = ( name, payload ) =>
    ( listeners[name] || [] ).forEach( ( listener ) => listener( payload as never ) );
  return { bridge, listeners, fire };
}

// Records every value a reaction sees, so a test can prove it re-ran.
export function track<T>( fn: () => T ): { seen: T[]; stop: () => void } {
  const seen: T[] = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}
