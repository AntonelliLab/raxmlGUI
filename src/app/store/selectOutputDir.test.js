// @ts-nocheck — the test is not typed yet.
import { expect, it, vi } from 'vitest';
import Run from './Run';

it( 'the output-directory picker sets the chosen directory', async () => {
  const run = new Run( {}, 7 );
  const selectOutputDir = vi.fn( async () => '/data/results' );
  window.rendererBridge = { selectOutputDir };

  await run.selectOutputDir();

  expect( selectOutputDir ).toHaveBeenCalledWith( 7 );
  expect( run.outputDir ).toBe( '/data/results' );
} );

it( 'cancel leaves the output directory unchanged', async () => {
  const run = new Run( {}, 7 );
  run.setOutputDir( '/data/already' );
  window.rendererBridge = {
    selectOutputDir: vi.fn( async () => null ),
  };

  await run.selectOutputDir();

  expect( window.rendererBridge.selectOutputDir ).toHaveBeenCalledWith( 7 );
  expect( run.outputDir ).toBe( '/data/already' );
} );

it( 'a dialog failure fails the output-directory choice', async () => {
  const run = new Run( {}, 7 );
  run.setOutputDir( '/data/already' );
  window.rendererBridge = {
    selectOutputDir: async () => {
      throw new Error( 'dialog failed' );
    },
  };

  await expect( run.selectOutputDir() ).rejects.toThrow( 'dialog failed' );
  expect( run.outputDir ).toBe( '/data/already' );
} );
