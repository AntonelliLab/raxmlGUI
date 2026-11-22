import { expect, it, vi } from 'vitest';
import { when } from 'mobx';
import { installBridge } from '../../test/setup';
import Run from './Run';

// The run reads nothing from its parent here, so the stand-in is empty.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'the output-name check uses checkOutput', async () => {
  const checkOutput = vi.fn( async () => ( {
    outputDir: '/data/out',
    outputName: 'tree',
    ok: false,
    notice: "Using 'tree_1'",
    outputNameUnused: 'tree_1',
    resultFilenames: ['tree.raxml.log'],
  } ) );
  installBridge( { checkOutput } );
  const run = new Run( {} as RunParent, 7 );
  run.setOutputDir( '/data/out' );
  run.setOutputName( 'tree' );

  let seen;
  await when( () => {
    const value = run.outputNameAvailable.get();
    if ( value.outputNameUnused !== 'tree_1' ) {
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
