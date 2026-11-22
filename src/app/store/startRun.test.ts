import { expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { RendererBridge } from '../../common/rendererBridge';
import type { CheckOutputResult } from '../../main/checkOutput';
import type { AlignmentSequence } from '../../main/parseAlignment';
import { installBridge } from '../../test/setup';

import Run from './Run';
import { runEvents } from './StoreBase';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];
type Stream = 'stdout' | 'stderr' | 'finished' | 'error';
// Every bridge listener fits this, whatever payload its event carries.
type Listener = ( payload: never ) => void;

function bridge( extra: Partial<RendererBridge> = {} ) {
  const listeners: Record<Stream, Listener[]> = {
    stdout: [],
    stderr: [],
    finished: [],
    error: [],
  };
  const stops: Stream[] = [];
  const subscribe = ( key: Stream ) => ( listener: Listener ) => {
    listeners[key].push( listener );
    return () => {
      stops.push( key );
    };
  };
  installBridge( {
    [runEvents.onRunStdout]: subscribe( 'stdout' ),
    [runEvents.onRunStderr]: subscribe( 'stderr' ),
    [runEvents.onRunFinished]: subscribe( 'finished' ),
    [runEvents.onRunError]: subscribe( 'error' ),
    parseAlignment: () => new Promise( () => {} ),
    checkOutput: async () => ( { ok: true, resultFilenames: [] } as CheckOutputResult ),
    writeFile: async () => {},
    async cancelRun() {},
    ...extra,
  } );
  return { listeners, stops };
}

function emit( list: Listener[], payload: unknown ) {
  list.forEach( ( listener ) => listener( payload as never ) );
}

it( 'startRun starts the run', async () => {
  const outputDir = fs.mkdtempSync( path.join( os.tmpdir(), 'raxml-run-' ) );
  const startRun = vi.fn( async () => {} );
  bridge( { startRun } );
  const run = new Run( { onError() {} } as Partial<RunParent> as RunParent, 7 );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  run.alignments[0].sequences = [
    { taxon: 'A' },
    { taxon: 'B' },
    { taxon: 'C' },
    { taxon: 'D' },
  ] as AlignmentSequence[];
  run.setOutputDir( outputDir );

  try {
    await run.start();

    expect( startRun ).toHaveBeenCalledWith( {
      id: 7,
      args: run.args,
      binaryName: run.binary.value,
      outputDir,
      outputFilename: '7.tre',
      outputName: '7',
      combinedOutput: false,
      usesRaxmlNg: run.usesRaxmlNg,
      usesModeltestNg: run.usesModeltestNg,
      inputPath: '/data/primates.fasta',
    } );
  } finally {
    fs.rmSync( outputDir, { recursive: true, force: true } );
  }
} );

it( 'stdout, stderr, finish, and failure update the run', () => {
  const { listeners, stops } = bridge();
  const run = new Run( { onError() {} } as Partial<RunParent> as RunParent, 7 );
  run.running = true;

  emit( listeners.stdout, { id: 7, content: 'tree\n' } );
  emit( listeners.stdout, { id: 'other', content: 'nope' } );
  emit( listeners.stderr, { id: 7, content: 'warn\n' } );
  expect( run.stdout ).toBe( 'tree\n' );
  expect( run.stderr ).toBe( 'warn\n' );

  emit( listeners.finished, {
    id: 7,
    resultDir: '/out',
    resultFilenames: ['primates.tre'],
    exitCode: 0,
  } );
  expect( run.resultDir ).toBe( '/out' );
  expect( run.exitCode ).toBe( 0 );
  expect( run.finished ).toBe( true );
  expect( run.running ).toBe( false );

  run.running = true;
  emit( listeners.error, { id: 7, error: 'missing binary' } );
  expect( run.error ).toBe( 'missing binary' );
  expect( run.running ).toBe( false );
  emit( listeners.error, { id: 'other', error: 'ignore' } );
  expect( run.error ).toBe( 'missing binary' );

  run.dispose();
  expect( stops.slice().sort() ).toEqual( ['error', 'finished', 'stderr', 'stdout'] );
} );

it( 'alignment output is appended for that alignment', () => {
  const { listeners } = bridge();
  const run = new Run( { onError() {} } as Partial<RunParent> as RunParent, 7 );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];

  emit( listeners.stdout, { id: alignment.id, content: 'model\n' } );
  emit( listeners.stderr, { id: alignment.id, content: 'slow\n' } );

  expect( run.stdout ).toBe( 'model\n' );
  expect( run.stderr ).toBe( 'slow\n' );
} );
