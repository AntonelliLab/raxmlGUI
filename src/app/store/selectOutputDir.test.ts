import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';
import Run from './Run';

// The run reads nothing from its parent here, so the stand-in is empty.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'the output-directory picker sets the chosen directory', async () => {
  const run = new Run( {} as RunParent, 7 );
  const selectOutputDir = vi.fn( async () => '/data/results' );
  installBridge( { selectOutputDir } );

  await run.selectOutputDir();

  expect( selectOutputDir ).toHaveBeenCalledWith( 7 );
  expect( run.outputDir ).toBe( '/data/results' );
} );

it( 'cancel leaves the output directory unchanged', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.setOutputDir( '/data/already' );
  installBridge( {
    selectOutputDir: vi.fn( async () => null ),
  } );

  await run.selectOutputDir();

  expect( window.rendererBridge.selectOutputDir ).toHaveBeenCalledWith( 7 );
  expect( run.outputDir ).toBe( '/data/already' );
} );

it( 'a dialog failure fails the output-directory choice', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.setOutputDir( '/data/already' );
  installBridge( {
    selectOutputDir: async () => {
      throw new Error( 'dialog failed' );
    },
  } );

  await expect( run.selectOutputDir() ).rejects.toThrow( 'dialog failed' );
  expect( run.outputDir ).toBe( '/data/already' );
} );
