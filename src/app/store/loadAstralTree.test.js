// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'the ASTRAL file picker adds the chosen file', async () => {
  const run = new Run( {}, 7 );
  const selectAstralFile = jest.fn( async () => ( {
    path: '/data/trees.tre',
    name: 'trees.tre',
  } ) );
  window.rendererBridge = { selectAstralFile };

  await run.loadAstralTree();

  expect( selectAstralFile ).toHaveBeenCalledWith( 7 );
  expect( run.astralTree.path ).toBe( '/data/trees.tre' );
} );

it( 'cancel leaves the ASTRAL file unchanged', async () => {
  const run = new Run( {}, 7 );
  run.addAstralFiles( { path: '/data/already.tre' } );
  window.rendererBridge = {
    selectAstralFile: jest.fn( async () => null ),
  };

  await run.loadAstralTree();

  expect( window.rendererBridge.selectAstralFile ).toHaveBeenCalledWith( 7 );
  expect( run.astralTree.path ).toBe( '/data/already.tre' );
} );

it( 'a dialog failure fails the ASTRAL file choice', async () => {
  const run = new Run( {}, 7 );
  run.addAstralFiles( { path: '/data/already.tre' } );
  window.rendererBridge = {
    selectAstralFile: async () => {
      throw new Error( 'dialog failed' );
    },
  };

  await expect( run.loadAstralTree() ).rejects.toThrow( 'dialog failed' );
  expect( run.astralTree.path ).toBe( '/data/already.tre' );
} );
