// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'the partition picker uses the chosen file', async () => {
  const run = new Run( {}, 7 );
  const selectPartitionFile = jest.fn( async () => '/data/genes.part' );
  const readFile = jest.fn( async () => 'DNA, gene = 1-100\n' );
  window.rendererBridge = { selectPartitionFile, readFile };

  await run.loadPartitionFile();

  expect( selectPartitionFile ).toHaveBeenCalledWith( 7 );
  expect( run.partitionFile ).toBe( '/data/genes.part' );
  expect( run.partitionFileContent ).toBe( 'DNA, gene = 1-100\n' );
} );

it( 'cancel leaves the partition unchanged', async () => {
  const run = new Run( {}, 7 );
  run.partitionFile = '/data/already.part';
  run.partitionFileContent = 'kept';
  window.rendererBridge = {
    selectPartitionFile: jest.fn( async () => null ),
  };

  await run.loadPartitionFile();

  expect( window.rendererBridge.selectPartitionFile ).toHaveBeenCalledWith( 7 );
  expect( run.partitionFile ).toBe( '/data/already.part' );
  expect( run.partitionFileContent ).toBe( 'kept' );
} );

it( 'a dialog failure fails the partition choice', async () => {
  const run = new Run( {}, 7 );
  run.partitionFile = '/data/already.part';
  run.partitionFileContent = 'kept';
  window.rendererBridge = {
    selectPartitionFile: async () => {
      throw new Error( 'dialog failed' );
    },
  };

  await expect( run.loadPartitionFile() ).rejects.toThrow( 'dialog failed' );
  expect( run.partitionFile ).toBe( '/data/already.part' );
  expect( run.partitionFileContent ).toBe( 'kept' );
} );
