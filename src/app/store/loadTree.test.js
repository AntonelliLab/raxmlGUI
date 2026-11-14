// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'each tree picker keeps the chosen file', async () => {
  const run = new Run( {}, 7 );
  const selectTree = jest.fn()
    .mockResolvedValueOnce( { type: 'tree', filePath: '/data/start.nwk' } )
    .mockResolvedValueOnce( { type: 'backboneConstraint', filePath: '/data/backbone.nwk' } )
    .mockResolvedValueOnce( { type: 'multifurcatingConstraint', filePath: '/data/multi.nwk' } );
  window.rendererBridge = { selectTree };

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
  const run = new Run( {}, 7 );
  run.tree.setFilePath( '/data/already.nwk' );
  window.rendererBridge = {
    selectTree: jest.fn( async () => null ),
  };

  await run.loadTreeFile();
  await run.loadBackboneConstraintFile();
  await run.loadMultifurcatingConstraintFile();

  expect( window.rendererBridge.selectTree ).toHaveBeenCalledWith( 7, 'tree' );
  expect( window.rendererBridge.selectTree ).toHaveBeenCalledWith( 7, 'backboneConstraint' );
  expect( window.rendererBridge.selectTree ).toHaveBeenCalledWith( 7, 'multifurcatingConstraint' );
  expect( run.tree.filePath ).toBe( '/data/already.nwk' );
  expect( run.backboneConstraint.filePath ).toBe( '' );
  expect( run.multifurcatingConstraint.filePath ).toBe( '' );
} );

it( 'a dialog failure fails the tree choice', async () => {
  const run = new Run( {}, 7 );
  run.tree.setFilePath( '/data/already.nwk' );
  window.rendererBridge = {
    selectTree: async () => {
      throw new Error( 'dialog failed' );
    },
  };

  await expect( run.loadTreeFile() ).rejects.toThrow( 'dialog failed' );
  expect( run.tree.filePath ).toBe( '/data/already.nwk' );
} );
