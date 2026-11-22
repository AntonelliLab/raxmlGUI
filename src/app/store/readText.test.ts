// @ts-nocheck — the test is not typed yet.
import { expect, it, vi } from 'vitest';
import Run from './Run';

it( 'reads a text file through the renderer bridge', async () => {
  const run = new Run( {}, 7 );
  const readFile = vi.fn( async () => 'DNA, gene = 1-100\n' );
  window.rendererBridge = { readFile };

  await run.addPartitionFiles( [{ path: '/data/genes.part' }] );

  expect( readFile ).toHaveBeenCalledWith( '/data/genes.part' );
  expect( run.partitionFile ).toBe( '/data/genes.part' );
  expect( run.partitionFileContent ).toBe( 'DNA, gene = 1-100\n' );
} );
