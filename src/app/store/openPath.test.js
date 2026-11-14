// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'opens a result file through the renderer bridge', async () => {
  const run = new Run( {}, 7 );
  const openPath = jest.fn( async () => '' );
  window.rendererBridge = { openPath };

  await run.openFile( '/data/results/tree.raxml.bestTree' );

  expect( openPath ).toHaveBeenCalledWith( '/data/results/tree.raxml.bestTree' );
} );

it( 'opens the output directory through the renderer bridge', async () => {
  const run = new Run( {}, 7 );
  run.setOutputDir( '/data/results' );
  const openPath = jest.fn( async () => '' );
  window.rendererBridge = { openPath };

  await run.openOutputDir();

  expect( openPath ).toHaveBeenCalledWith( '/data/results' );
} );
