import { expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { installBridge } from '../../test/setup';

import Run from './Run';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];

it( 'the cancel control uses cancelRun', () => {
  const cancelRun = vi.fn();
  installBridge( { cancelRun } );
  const run = new Run( { onError() {} } as Partial<RunParent> as RunParent, 7 );
  run.running = true;

  run.cancel();

  expect( cancelRun ).toHaveBeenCalledWith( 7 );
  expect( run.running ).toBe( false );
} );

it( 'cancel before the run is tracked does not start it', async () => {
  const outputDir = fs.mkdtempSync( path.join( os.tmpdir(), 'raxml-cancel-' ) );
  let holdWrites = true;
  const waiters: ( () => void )[] = [];
  const writeFile = vi.fn( () => {
    if ( !holdWrites ) {
      return Promise.resolve();
    }
    return new Promise<void>( ( resolve ) => {
      waiters.push( resolve );
    } );
  } );
  const startRun = vi.fn( async () => {} );
  const cancelRun = vi.fn();
  installBridge( {
    writeFile,
    startRun,
    cancelRun,
    parseAlignment: () => new Promise( () => {} ),
  } );
  const run = new Run( { onError() {} } as Partial<RunParent> as RunParent, 7 );
  run.setOutputDir( outputDir );
  run.addAlignments( [
    { path: '/data/a.fasta' },
    { path: '/data/b.fasta' },
  ] );
  const sequences = [
    { taxon: 'A', code: 'A' },
    { taxon: 'B', code: 'A' },
    { taxon: 'C', code: 'A' },
    { taxon: 'D', code: 'A' },
  ];
  run.alignments[0].sequences = sequences;
  run.alignments[1].sequences = sequences;

  try {
    const pending = run.start();
    run.cancel();
    holdWrites = false;
    waiters.forEach( ( release ) => release() );
    await pending;
    expect( startRun ).not.toHaveBeenCalled();
    expect( cancelRun ).toHaveBeenCalledWith( 7 );
  } finally {
    fs.rmSync( outputDir, { recursive: true, force: true } );
  }
} );
