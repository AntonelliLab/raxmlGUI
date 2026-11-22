import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';
import Run from './Run';

// The run reads nothing from its parent here, so the stand-in is empty.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'reads a text file through the renderer bridge', async () => {
  const run = new Run( {} as RunParent, 7 );
  const readFile = vi.fn( async () => 'DNA, gene = 1-100\n' );
  installBridge( { readFile } );

  await run.addPartitionFiles( [{ path: '/data/genes.part' }] );

  expect( readFile ).toHaveBeenCalledWith( '/data/genes.part' );
  expect( run.partitionFile ).toBe( '/data/genes.part' );
  expect( run.partitionFileContent ).toBe( 'DNA, gene = 1-100\n' );
} );
