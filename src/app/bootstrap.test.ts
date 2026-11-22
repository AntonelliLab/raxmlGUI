// @ts-nocheck — the test is not typed yet.
import { expect, it, vi } from 'vitest';

async function loadBootstrap( nodeEnv ) {
  const previousEnv = process.env.NODE_ENV;
  const previousE2E = process.env.RAXMLGUI_E2E;
  process.env.NODE_ENV = nodeEnv;
  delete process.env.RAXMLGUI_E2E;
  let store;
  try {
    vi.resetModules();
    store = ( await import( './store' ) ).default;
    await import( './bootstrap' );
  } finally {
    process.env.NODE_ENV = previousEnv;
    if ( previousE2E === undefined ) {
      delete process.env.RAXMLGUI_E2E;
    } else {
      process.env.RAXMLGUI_E2E = previousE2E;
    }
  }
  return store;
}

it( 'the dev bootstrap loads the example files', async () => {
  const getExampleFiles = vi.fn( async () => ( {
    fasta: ['nucleotide.txt'],
    phylip: ['dna_sequential.txt'],
    dir: '/examples',
    outdir: '/out',
  } ) );
  window.rendererBridge = {
    getExampleFiles,
    parseAlignment: () => new Promise( () => {} ),
  };

  const store = await loadBootstrap( 'development' );

  expect( getExampleFiles ).toHaveBeenCalledTimes( 1 );
  await getExampleFiles.mock.results[0].value;
  expect( store.activeRun.outputDir ).toBe( '/out' );
  expect( store.activeRun.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/examples/fasta/nucleotide.txt',
  ] );
} );

it( 'a production load does not ask for the example files', async () => {
  const getExampleFiles = vi.fn();
  window.rendererBridge = { getExampleFiles };

  await loadBootstrap( 'production' );

  expect( getExampleFiles ).not.toHaveBeenCalled();
} );
