// @ts-nocheck — Jest globals. checkJs has no test runner types.
import InputFile from './InputFile';
import Run from './Run';

it( 'shows a tree file in its folder', async () => {
  const run = new Run( {}, 7 );
  run.tree.setFilePath( '/data/start.nwk' );
  const showItemInFolder = jest.fn( async () => {} );
  window.rendererBridge = { showItemInFolder };

  await run.tree.openFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/start.nwk' );
} );

it( 'shows an input file in its folder', async () => {
  const file = new InputFile( { id: 7 }, '/data/primates.fasta' );
  const showItemInFolder = jest.fn( async () => {} );
  window.rendererBridge = { showItemInFolder };

  await file.showFileInFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/primates.fasta' );
} );

it( 'shows the concatenated alignment in its folder', async () => {
  const run = new Run( {}, 7 );
  window.rendererBridge = { parseAlignment: () => new Promise( () => {} ) };
  run.addAlignments( [ { path: '/data/a.fasta' } ] );
  run.alignments[0].sequences = [
    { taxon: 'Homo', code: 'AT' },
    { taxon: 'Mus', code: 'GC' },
  ];
  run.alignments[0].length = 2;
  const showItemInFolder = jest.fn( async () => {} );
  window.rendererBridge = {
    writeFile: jest.fn( async () => {} ),
    showItemInFolder,
  };

  await run.finalAlignment.showFileInFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/a.fasta' );
} );
