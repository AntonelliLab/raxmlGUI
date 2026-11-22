import { expect, it, vi } from 'vitest';
import type { RendererBridge } from '../../common/rendererBridge';
import type { CheckOutputResult } from '../../main/checkOutput';
import { installBridge } from '../../test/setup';

import Run from './Run';
import { runEvents } from './StoreBase';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];
const parent = { onError() {} } as Partial<RunParent> as RunParent;
// Every bridge listener fits this, whatever payload its event carries.
type Listener = ( payload: never ) => void;

function bridge( extra: Partial<RendererBridge> = {} ) {
  const listeners: { success: Listener[] } = {
    success: [],
  };
  const stops: string[] = [];
  installBridge( {
    [runEvents.onAstralSuccess]: ( listener: Listener ) => {
      listeners.success.push( listener );
      return () => {
        stops.push( 'success' );
      };
    },
    checkOutput: async () => ( { ok: true, resultFilenames: [] } as CheckOutputResult ),
    parseAlignment: () => new Promise( () => {} ),
    ...extra,
  } );
  return { listeners, stops };
}

function emit( list: Listener[], payload: unknown ) {
  list.forEach( ( listener ) => listener( payload as never ) );
}

it( 'startAstral starts ASTRAL', async () => {
  const startAstral = vi.fn( async () => {} );
  bridge( { startAstral } );
  const run = new Run( parent, 7 );
  run.setOutputDir( '/out' );

  await run.startAstral();

  expect( run.running ).toBe( true );
  expect( startAstral ).toHaveBeenCalledWith( {
    id: 7,
    binaryName: run.binary.value,
    args: run.args,
  } );
} );

it( 'an ASTRAL exit code is recorded for that run', () => {
  const { listeners, stops } = bridge();
  const run = new Run( parent, 7 );
  run.running = true;
  run.setOutputDir( '/out' );

  emit( listeners.success, { id: 'other', exitCode: 4 } );
  expect( run.exitCode ).toBe( 0 );
  expect( run.finished ).toBe( false );
  expect( run.running ).toBe( true );

  emit( listeners.success, { id: 7, exitCode: 3 } );
  expect( run.exitCode ).toBe( 3 );
  expect( run.resultDir ).toBe( '/out' );
  expect( run.finished ).toBe( true );
  expect( run.running ).toBe( false );

  run.dispose();
  expect( stops ).toEqual( ['success'] );
} );
