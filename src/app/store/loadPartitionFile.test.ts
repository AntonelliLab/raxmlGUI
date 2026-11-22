import { expect, it, vi } from 'vitest';
import Run from './Run';
import { installBridge } from '../../test/setup';

type RunParent = ConstructorParameters<typeof Run>[0];

it( 'the partition picker uses the chosen file', async () => {
  const run = new Run( {} as RunParent, 7 );
  const selectPartitionFile = vi.fn( async () => '/data/genes.part' );
  const readFile = vi.fn( async () => 'DNA, gene = 1-100\n' );
  installBridge( { selectPartitionFile, readFile } );

  await run.loadPartitionFile();

  expect( selectPartitionFile ).toHaveBeenCalledWith( 7 );
  expect( run.partitionFile ).toBe( '/data/genes.part' );
  expect( run.partitionFileContent ).toBe( 'DNA, gene = 1-100\n' );
} );

it( 'cancel leaves the partition unchanged', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.partitionFile = '/data/already.part';
  run.partitionFileContent = 'kept';
  installBridge( {
    selectPartitionFile: vi.fn( async () => null ),
  } );

  await run.loadPartitionFile();

  expect( window.rendererBridge.selectPartitionFile ).toHaveBeenCalledWith( 7 );
  expect( run.partitionFile ).toBe( '/data/already.part' );
  expect( run.partitionFileContent ).toBe( 'kept' );
} );

it( 'a dialog failure fails the partition choice', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.partitionFile = '/data/already.part';
  run.partitionFileContent = 'kept';
  installBridge( {
    selectPartitionFile: async () => {
      throw new Error( 'dialog failed' );
    },
  } );

  await expect( run.loadPartitionFile() ).rejects.toThrow( 'dialog failed' );
  expect( run.partitionFile ).toBe( '/data/already.part' );
  expect( run.partitionFileContent ).toBe( 'kept' );
} );
