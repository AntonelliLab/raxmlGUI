// @ts-nocheck — Jest globals. checkJs has no test runner types.

function loadBootstrap( nodeEnv ) {
  const previousEnv = process.env.NODE_ENV;
  const previousE2E = process.env.RAXMLGUI_E2E;
  process.env.NODE_ENV = nodeEnv;
  delete process.env.RAXMLGUI_E2E;
  let store;
  try {
    jest.isolateModules( () => {
      store = require( './store' ).default;
      require( './bootstrap' );
    } );
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
  const getExampleFiles = jest.fn( async () => ( {
    fasta: ['nucleotide.txt'],
    phylip: ['dna_sequential.txt'],
    dir: '/examples',
    outdir: '/out',
  } ) );
  window.rendererBridge = {
    getExampleFiles,
    parseAlignment: () => new Promise( () => {} ),
  };

  const store = loadBootstrap( 'development' );

  expect( getExampleFiles ).toHaveBeenCalledTimes( 1 );
  await getExampleFiles.mock.results[0].value;
  expect( store.activeRun.outputDir ).toBe( '/out' );
  expect( store.activeRun.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/examples/fasta/nucleotide.txt',
  ] );
} );

it( 'a production load does not ask for the example files', () => {
  const getExampleFiles = jest.fn();
  window.rendererBridge = { getExampleFiles };

  loadBootstrap( 'production' );

  expect( getExampleFiles ).not.toHaveBeenCalled();
} );
