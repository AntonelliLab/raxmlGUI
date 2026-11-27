import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';

import Run from './Run';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];
const parent = {} as Partial<RunParent> as RunParent;

it( 'the ASTRAL file picker adds the chosen file', async () => {
  const run = new Run( parent, 7 );
  const selectAstralFile = vi.fn( async () => ( {
    path: '/data/trees.tre',
    name: 'trees.tre',
  } ) );
  installBridge( { selectAstralFile } );

  await run.loadAstralTree();

  expect( selectAstralFile ).toHaveBeenCalledWith( 7 );
  expect( run.astralTree!.path ).toBe( '/data/trees.tre' );
} );

it( 'cancel leaves the ASTRAL file unchanged', async () => {
  const run = new Run( parent, 7 );
  run.addAstralFiles( { path: '/data/already.tre' } );
  const selectAstralFile = vi.fn( async () => null );
  installBridge( { selectAstralFile } );

  await run.loadAstralTree();

  expect( selectAstralFile ).toHaveBeenCalledWith( 7 );
  expect( run.astralTree!.path ).toBe( '/data/already.tre' );
} );

it( 'a dialog failure fails the ASTRAL file choice', async () => {
  const run = new Run( parent, 7 );
  run.addAstralFiles( { path: '/data/already.tre' } );
  installBridge( {
    selectAstralFile: async () => {
      throw new Error( 'dialog failed' );
    },
  } );

  await expect( run.loadAstralTree() ).rejects.toThrow( 'dialog failed' );
  expect( run.astralTree!.path ).toBe( '/data/already.tre' );
} );
