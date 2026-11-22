import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';
import Run from './Run';

// The run reads nothing from its parent here, so the stand-in is empty.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'opens a result file through the renderer bridge', async () => {
  const run = new Run( {} as RunParent, 7 );
  const openPath = vi.fn( async () => '' );
  installBridge( { openPath } );

  await run.openFile( '/data/results/tree.raxml.bestTree' );

  expect( openPath ).toHaveBeenCalledWith( '/data/results/tree.raxml.bestTree' );
} );

it( 'opens the output directory through the renderer bridge', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.setOutputDir( '/data/results' );
  const openPath = vi.fn( async () => '' );
  installBridge( { openPath } );

  await run.openOutputDir();

  expect( openPath ).toHaveBeenCalledWith( '/data/results' );
} );
