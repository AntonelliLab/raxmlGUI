import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';

import Run from './Run';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];
const parent = {} as Partial<RunParent> as RunParent;

it( 'each tree picker keeps the chosen file', async () => {
  const run = new Run( parent, 7 );
  const selectTree = vi.fn()
    .mockResolvedValueOnce( { type: 'tree', filePath: '/data/start.nwk' } )
    .mockResolvedValueOnce( { type: 'backboneConstraint', filePath: '/data/backbone.nwk' } )
    .mockResolvedValueOnce( { type: 'multifurcatingConstraint', filePath: '/data/multi.nwk' } );
  installBridge( { selectTree } );

  await run.loadTreeFile();
  await run.loadBackboneConstraintFile();
  await run.loadMultifurcatingConstraintFile();

  expect( selectTree ).toHaveBeenNthCalledWith( 1, 7, 'tree' );
  expect( selectTree ).toHaveBeenNthCalledWith( 2, 7, 'backboneConstraint' );
  expect( selectTree ).toHaveBeenNthCalledWith( 3, 7, 'multifurcatingConstraint' );
  expect( run.tree.filePath ).toBe( '/data/start.nwk' );
  expect( run.backboneConstraint.filePath ).toBe( '/data/backbone.nwk' );
  expect( run.multifurcatingConstraint.filePath ).toBe( '/data/multi.nwk' );
} );

it( 'cancel leaves the trees unchanged', async () => {
  const run = new Run( parent, 7 );
  run.tree.setFilePath( '/data/already.nwk' );
  const selectTree = vi.fn( async () => null );
  installBridge( { selectTree } );

  await run.loadTreeFile();
  await run.loadBackboneConstraintFile();
  await run.loadMultifurcatingConstraintFile();

  expect( selectTree ).toHaveBeenCalledWith( 7, 'tree' );
  expect( selectTree ).toHaveBeenCalledWith( 7, 'backboneConstraint' );
  expect( selectTree ).toHaveBeenCalledWith( 7, 'multifurcatingConstraint' );
  expect( run.tree.filePath ).toBe( '/data/already.nwk' );
  expect( run.backboneConstraint.filePath ).toBe( '' );
  expect( run.multifurcatingConstraint.filePath ).toBe( '' );
} );

it( 'a dialog failure fails the tree choice', async () => {
  const run = new Run( parent, 7 );
  run.tree.setFilePath( '/data/already.nwk' );
  installBridge( {
    selectTree: async () => {
      throw new Error( 'dialog failed' );
    },
  } );

  await expect( run.loadTreeFile() ).rejects.toThrow( 'dialog failed' );
  expect( run.tree.filePath ).toBe( '/data/already.nwk' );
} );
