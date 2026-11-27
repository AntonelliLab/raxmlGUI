import os from 'node:os';

import { runEvents } from '../app/store/StoreBase';
import type { HostInfo, RendererBridge } from '../common/rendererBridge';

type TestBridge = Partial<RendererBridge>;
type RunEventName = keyof typeof runEvents;

// React 19 flushes a render inside act() when this flag is set.
( globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean } ).IS_REACT_ACT_ENVIRONMENT = true;

// Run, an alignment, the run list, and the theme listen at construction. A test assignment keeps its object.
const runEventNames = Object.values( runEvents ) as RunEventName[];
const runEventStub = () => (): void => {};

// Pinned off Windows: the store tests expect the macOS/Linux binary list (raxml-ng); host.test.ts covers Windows.
const host: HostInfo = {
  windows: false,
  release: os.release(),
  arch: os.arch(),
  cpuModel: os.cpus()[0].model,
};

function withBridgeEvents( next: TestBridge ): TestBridge {
  for ( const name of runEventNames ) {
    if ( typeof next[name] !== 'function' ) {
      next[name] = runEventStub;
    }
  }
  if ( !Object.prototype.hasOwnProperty.call( next, 'host' ) ) {
    next.host = host;
  }
  // Run.dispose calls cancel, which calls cancelRun.
  // Alignment.dispose calls cancelModelTest while model selection is loading.
  if ( typeof next.cancelRun !== 'function' ) {
    next.cancelRun = () => Promise.resolve();
  }
  if ( typeof next.cancelModelSelection !== 'function' ) {
    next.cancelModelSelection = () => Promise.resolve();
  }
  if ( typeof next.provideStateReport !== 'function' ) {
    next.provideStateReport = () => {};
  }
  // The page store calls getVersion while it is constructed.
  if ( typeof next.getVersion !== 'function' ) {
    next.getVersion = () => Promise.resolve( undefined );
  }
  // The run list seeds the update download when it listens.
  if ( typeof next.getUpdateDownload !== 'function' ) {
    next.getUpdateDownload = () => Promise.resolve( { status: 'idle' } );
  }
  // The output panel checks the output name; MobX 6 re-renders it inside the render test when this rejects.
  if ( typeof next.checkOutput !== 'function' ) {
    next.checkOutput = ( { outputDir, outputName } ) =>
      Promise.resolve( { outputDir, outputName, ok: true, notice: '', outputNameUnused: '', resultFilenames: [] } );
  }
  // Config construction reads and may write dark mode.
  if ( typeof next.getDarkMode !== 'function' ) {
    next.getDarkMode = () => Promise.resolve( false );
  }
  if ( typeof next.setDarkMode !== 'function' ) {
    next.setDarkMode = () => Promise.resolve();
  }
  return next;
}

// The one default bridge object: the page store and `host` read it while their modules load.
const defaultBridge = withBridgeEvents( { host } );
let bridge = defaultBridge;

// The setter serves the tests that still assign a bridge directly; each conversion ticket moves its files to installBridge.
// A `@vitest-environment node` file has no window; it gets no page bridge.
Object.defineProperty( globalThis.window ?? {}, 'rendererBridge', {
  configurable: true,
  enumerable: true,
  get() {
    return bridge;
  },
  set( next: TestBridge ) {
    bridge = withBridgeEvents( next );
  },
} );

// Merges a test's methods onto the default bridge object and makes it the page's bridge again.
// Descriptors are copied, so a `host` getter is never read.
export function installBridge( partial: TestBridge ): RendererBridge {
  bridge = defaultBridge;
  return Object.defineProperties( defaultBridge, Object.getOwnPropertyDescriptors( partial ) ) as RendererBridge;
}
