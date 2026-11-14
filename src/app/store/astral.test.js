// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';
import { runEvents } from './StoreBase';

function bridge( extra ) {
  const listeners = {
    success: [],
  };
  const stops = [];
  window.rendererBridge = {
    [runEvents.onAstralSuccess]: ( listener ) => {
      listeners.success.push( listener );
      return () => {
        stops.push( 'success' );
      };
    },
    checkOutput: async () => ( { ok: true, resultFilenames: [] } ),
    parseAlignment: () => new Promise( () => {} ),
    ...extra,
  };
  return { listeners, stops };
}

function emit( list, payload ) {
  list.forEach( ( listener ) => listener( payload ) );
}

it( 'startAstral starts ASTRAL', async () => {
  const startAstral = jest.fn( async () => {} );
  bridge( { startAstral } );
  const run = new Run( { onError() {} }, 7 );
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
  const run = new Run( { onError() {} }, 7 );
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
