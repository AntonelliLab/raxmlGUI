// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'the cancel control uses cancelRun', () => {
  const cancelRun = jest.fn();
  window.rendererBridge = { cancelRun };
  const run = new Run( { onError() {} }, 'run-7' );
  run.running = true;

  run.cancel();

  expect( cancelRun ).toHaveBeenCalledWith( 'run-7' );
  expect( run.running ).toBe( false );
} );
