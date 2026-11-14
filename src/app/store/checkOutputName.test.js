// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { when } from 'mobx';
import Run from './Run';

it( 'the output-name check uses checkOutput', async () => {
  const checkOutput = jest.fn( async () => ( {
    outputDir: '/data/out',
    outputName: 'tree',
    ok: false,
    notice: "Using 'tree_1'",
    outputNameUnused: 'tree_1',
    resultFilenames: ['tree.raxml.log'],
  } ) );
  window.rendererBridge = { checkOutput };
  const run = new Run( {}, 7 );
  run.setOutputDir( '/data/out' );
  run.setOutputName( 'tree' );

  let seen;
  await when( () => {
    const value = run.outputNameAvailable.get();
    if ( run.outputNameAvailable.busy || value.outputNameUnused !== 'tree_1' ) {
      return false;
    }
    seen = {
      ok: value.ok,
      files: run.resultFilenames,
      safe: run.outputNameSafe,
    };
    return true;
  }, { timeout: 1000 } );

  expect( checkOutput ).toHaveBeenCalledTimes( 1 );
  expect( checkOutput ).toHaveBeenCalledWith( {
    outputDir: '/data/out',
    outputName: 'tree',
  } );
  expect( seen ).toEqual( {
    ok: false,
    files: ['tree.raxml.log'],
    safe: 'tree_1',
  } );
} );
