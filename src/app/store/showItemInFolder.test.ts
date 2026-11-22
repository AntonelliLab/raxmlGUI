import { expect, it, vi } from 'vitest';
import { runInAction } from 'mobx';
import { installBridge } from '../../test/setup';
import Run from './Run';

// The run reads nothing from its parent here, so the stand-in is empty.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'shows a tree file in its folder', async () => {
  const run = new Run( {} as RunParent, 7 );
  run.tree.setFilePath( '/data/start.nwk' );
  const showItemInFolder = vi.fn( async () => {} );
  installBridge( { showItemInFolder } );

  await run.tree.openFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/start.nwk' );
} );

it( 'shows the concatenated alignment in its folder', async () => {
  const run = new Run( {} as RunParent, 7 );
  installBridge( { parseAlignment: () => new Promise( () => {} ) } );
  run.addAlignments( [ { path: '/data/a.fasta' } ] );
  runInAction( () => {
    run.alignments[0].sequences = [
      { taxon: 'Homo', code: 'AT' },
      { taxon: 'Mus', code: 'GC' },
    ];
    run.alignments[0].length = 2;
  } );
  const showItemInFolder = vi.fn( async () => {} );
  installBridge( {
    writeFile: vi.fn( async () => {} ),
    showItemInFolder,
  } );

  await run.finalAlignment.showFileInFolder();

  expect( showItemInFolder ).toHaveBeenCalledWith( '/data/a.fasta' );
} );
