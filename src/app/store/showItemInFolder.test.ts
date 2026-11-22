// @ts-nocheck — the test is not typed yet.
import { expect, it, vi } from 'vitest';
import { runInAction } from 'mobx';
import Run from './Run';

it( 'shows a tree file in its folder', async () => {
  const run = new Run( {}, 7 );
  run.tree.setFilePath( '/data/start.nwk' );
  const showItemInFolder = vi.fn( async () => {} );
  window.rendererBridge = { showItemInFolder };

  await run.tree.openFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/start.nwk' );
} );

it( 'shows the concatenated alignment in its folder', async () => {
  const run = new Run( {}, 7 );
  window.rendererBridge = { parseAlignment: () => new Promise( () => {} ) };
  run.addAlignments( [ { path: '/data/a.fasta' } ] );
  runInAction( () => {
    run.alignments[0].sequences = [
      { taxon: 'Homo', code: 'AT' },
      { taxon: 'Mus', code: 'GC' },
    ];
    run.alignments[0].length = 2;
  } );
  const showItemInFolder = vi.fn( async () => {} );
  window.rendererBridge = {
    writeFile: vi.fn( async () => {} ),
    showItemInFolder,
  };

  await run.finalAlignment.showFileInFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/a.fasta' );
} );
