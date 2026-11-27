import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runInAction } from 'mobx';

import type { RendererBridge } from '../../common/rendererBridge';
import type { CheckOutputResult } from '../../main/checkOutput';
import type { AlignmentSequence } from '../../main/parseAlignment';
import { stubBridge, track } from '../../test/storeBridge';

import Run from './Run';
import { runEvents } from './StoreBase';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];

let bridge: RendererBridge;
let fire: ReturnType<typeof stubBridge>['fire'];

// The run subscribes to bridge events at construction; stubBridge keeps each listener so a test can fire it.
beforeEach( () => {
  ( { bridge, fire } = stubBridge( {
    startRun: vi.fn( async () => {} ),
    startAstral: vi.fn( async () => {} ),
    cancelRun: vi.fn(),
    writeFile: vi.fn( async () => {} ),
    checkOutput: vi.fn( async () => ( { ok: true, resultFilenames: ['out.tre'] } as CheckOutputResult ) ),
    parseAlignment: () => new Promise( () => {} ),
  } ) );
} );

function makeRun( { numSequences = 4 } = {} ) {
  const parent = { onError: vi.fn() };
  const run = new Run( parent as Partial<RunParent> as RunParent, 7 );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  run.alignments[0].sequences = Array.from( { length: numSequences }, ( _, i ) => ( {
    taxon: `T${i}`,
  } ) ) as AlignmentSequence[];
  run.setOutputDir( '/out' );
  return { run, parent };
}

describe( 'start', () => {
  it( 'marks the run running and starts it on the bridge', async () => {
    const { run } = makeRun();
    const startDisabled = track( () => run.startDisabled );
    expect( startDisabled.seen.at( -1 ) ).toBe( false );

    await run.start();

    expect( run.running ).toBe( true );
    expect( bridge.startRun ).toHaveBeenCalledTimes( 1 );
    expect( vi.mocked( bridge.startRun ).mock.calls[0][0] ).toMatchObject( {
      id: 7,
      binaryName: run.binary.value,
      outputDir: '/out',
      inputPath: '/data/primates.fasta',
    } );
    expect( startDisabled.seen.at( -1 ) ).toBe( true );
    startDisabled.stop();
  } );

  it( 'writes the settings file before starting', async () => {
    const { run } = makeRun();
    await run.start();
    expect( bridge.writeFile ).toHaveBeenCalledWith(
      run.settingsFilePath,
      run.settingsFileContent,
    );
  } );

  it( 'reports an error and does not start with fewer than four sequences', async () => {
    const { run, parent } = makeRun( { numSequences: 3 } );

    await run.start();

    expect( parent.onError ).toHaveBeenCalledTimes( 1 );
    expect( parent.onError.mock.calls[0][0].message ).toMatch( /at least four sequences/ );
    expect( run.running ).toBe( false );
    expect( bridge.startRun ).not.toHaveBeenCalled();
  } );

  it( 'adopts the safe output name, which a reaction on the name sees', async () => {
    const { run } = makeRun();
    bridge.checkOutput = vi.fn( async () => ( {
      ok: false,
      outputNameUnused: 'primates_2',
      resultFilenames: [] as string[],
    } as CheckOutputResult ) );
    const name = track( () => run.outputName );
    const safe = track( () => run.outputNameSafe );
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    expect( safe.seen.at( -1 ) ).toBe( 'primates_2' );

    await run.start();

    expect( run.outputName ).toBe( 'primates_2' );
    expect( name.seen.at( -1 ) ).toBe( 'primates_2' );
    name.stop();
    safe.stop();
  } );
} );

describe( 'streamed output', () => {
  it( 'appends stdout and stderr for this run only, and reactions see it', () => {
    const { run } = makeRun();
    const report = track( () => run.generateReport().stdout );
    const stderr = track( () => run.stderr );

    fire( runEvents.onRunStdout, { id: 7, content: 'tree\n' } );
    fire( runEvents.onRunStdout, { id: 7, content: 'more\n' } );
    fire( runEvents.onRunStdout, { id: 8, content: 'other run' } );
    fire( runEvents.onRunStderr, { id: 7, content: 'warn\n' } );
    fire( runEvents.onRunStderr, { id: 8, content: 'other run' } );

    expect( run.stdout ).toBe( 'tree\nmore\n' );
    expect( run.stderr ).toBe( 'warn\n' );
    expect( report.seen.at( -1 ) ).toBe( 'tree\nmore\n' );
    expect( stderr.seen.at( -1 ) ).toBe( 'warn\n' );
    report.stop();
    stderr.stop();
  } );

  it( 'clearing the console empties both streams for reactions', () => {
    const { run } = makeRun();
    fire( runEvents.onRunStdout, { id: 7, content: 'a' } );
    fire( runEvents.onRunStderr, { id: 7, content: 'b' } );
    const both = track( () => `${run.stdout}|${run.stderr}` );

    run.clearConsole();

    expect( both.seen.at( -1 ) ).toBe( '|' );
    both.stop();
  } );
} );

describe( 'finish', () => {
  it( 'records the result and frees the run', async () => {
    const { run } = makeRun();
    const startDisabled = track( () => run.startDisabled );
    const finished = track( () => [run.finished, run.exitCode] );
    const haveResult = track( () => run.haveResult );
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    runInAction( () => {
      run.running = true;
    } );
    expect( startDisabled.seen.at( -1 ) ).toBe( true );
    expect( haveResult.seen.at( -1 ) ).toBe( false );

    fire( runEvents.onRunFinished, {
      id: 7,
      resultDir: '/out',
      resultFilenames: ['out.tre'],
      exitCode: 0,
    } );

    expect( run.resultDir ).toBe( '/out' );
    expect( run.finished ).toBe( true );
    expect( run.exitCode ).toBe( 0 );
    expect( run.running ).toBe( false );
    expect( startDisabled.seen.at( -1 ) ).toBe( false );
    expect( finished.seen.at( -1 ) ).toEqual( [true, 0] );
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    expect( haveResult.seen.at( -1 ) ).toBe( true );
    startDisabled.stop();
    finished.stop();
    haveResult.stop();
  } );

  it( 'records a non-zero exit code and clearFinished resets it', () => {
    const { run } = makeRun();
    const finished = track( () => [run.finished, run.exitCode] );

    fire( runEvents.onRunFinished, {
      id: 7,
      resultDir: '/out',
      resultFilenames: [],
      exitCode: 2,
    } );
    expect( finished.seen.at( -1 ) ).toEqual( [true, 2] );

    run.clearFinished();
    expect( finished.seen.at( -1 ) ).toEqual( [false, 0] );
    finished.stop();
  } );

  it( 'ignores a finish for another run', () => {
    const { run } = makeRun();
    runInAction( () => {
      run.running = true;
    } );

    fire( runEvents.onRunFinished, { id: 8, resultDir: '/x', resultFilenames: [], exitCode: 1 } );

    expect( run.finished ).toBe( false );
    expect( run.running ).toBe( true );
    expect( run.resultDir ).toBe( '' );
  } );

  it( 'checks the output again after the run, so the result list refreshes', async () => {
    const { run } = makeRun();
    const files = track( () => run.resultFilenames );
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    const before = vi.mocked( bridge.checkOutput ).mock.calls.length;

    fire( runEvents.onRunFinished, {
      id: 7,
      resultDir: '/out',
      resultFilenames: ['out.tre'],
      exitCode: 0,
    } );
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

    expect( vi.mocked( bridge.checkOutput ).mock.calls.length ).toBeGreaterThan( before );
    expect( files.seen.at( -1 ) ).toEqual( ['out.tre'] );
    files.stop();
  } );
} );

describe( 'failure', () => {
  it( 'shows the error, frees the run, and ok follows the error', () => {
    const { run } = makeRun();
    runInAction( () => {
      run.running = true;
    } );
    const ok = track( () => run.ok );
    const error = track( () => run.error );
    expect( ok.seen.at( -1 ) ).toBe( true );

    fire( runEvents.onRunError, { id: 7, error: 'missing binary' } );

    expect( run.error ).toBe( 'missing binary' );
    expect( run.running ).toBe( false );
    expect( run.finished ).toBe( false );
    expect( ok.seen.at( -1 ) ).toBe( false );
    expect( error.seen.at( -1 ) ).toBe( 'missing binary' );

    run.clearError();
    expect( ok.seen.at( -1 ) ).toBe( true );
    ok.stop();
    error.stop();
  } );

  it( 'ignores an error for another run', () => {
    const { run } = makeRun();

    fire( runEvents.onRunError, { id: 8, error: 'not mine' } );

    expect( run.error ).toBe( null );
  } );
} );

describe( 'cancel', () => {
  it( 'tells the bridge, frees the run, and stays quiet', () => {
    const { run, parent } = makeRun();
    runInAction( () => {
      run.running = true;
    } );
    const startDisabled = track( () => run.startDisabled );
    const ok = track( () => run.ok );
    expect( startDisabled.seen.at( -1 ) ).toBe( true );

    run.cancel();

    expect( bridge.cancelRun ).toHaveBeenCalledWith( 7 );
    expect( run.running ).toBe( false );
    expect( startDisabled.seen.at( -1 ) ).toBe( false );
    expect( run.error ).toBe( null );
    expect( ok.seen.at( -1 ) ).toBe( true );
    expect( run.finished ).toBe( false );
    expect( parent.onError ).not.toHaveBeenCalled();
    startDisabled.stop();
    ok.stop();
  } );

  it( 'stops a start that is still writing files from starting the run', async () => {
    const { run } = makeRun();
    let release!: () => void;
    bridge.writeFile = vi.fn(
      () => new Promise<void>( ( resolve ) => {
        release = resolve;
      } ),
    );

    const pending = run.start();
    run.cancel();
    release();
    await pending;

    expect( bridge.startRun ).not.toHaveBeenCalled();
    expect( run.running ).toBe( false );
    expect( run.error ).toBe( null );
  } );

  it( 'dispose cancels the run and unsubscribes its listeners', () => {
    const { run } = makeRun();

    run.dispose();

    expect( bridge.cancelRun ).toHaveBeenCalledWith( 7 );
    fire( runEvents.onRunStdout, { id: 7, content: 'late' } );
    expect( run.stdout ).toBe( '' );
  } );
} );

describe( 'ASTRAL', () => {
  it( 'shows ASTRAL is running and starts it on the bridge', async () => {
    const { run } = makeRun();
    const startDisabled = track( () => run.startDisabled );

    await run.startAstral();

    expect( run.running ).toBe( true );
    expect( startDisabled.seen.at( -1 ) ).toBe( true );
    expect( bridge.startAstral ).toHaveBeenCalledWith( {
      id: 7,
      binaryName: run.binary.value,
      args: run.args,
    } );
    startDisabled.stop();
  } );

  it( 'reports the ASTRAL result for this run', () => {
    const { run } = makeRun();
    runInAction( () => {
      run.running = true;
    } );
    const finished = track( () => [run.finished, run.exitCode, run.running] );

    fire( runEvents.onAstralSuccess, { id: 8, exitCode: 4 } );
    expect( finished.seen.at( -1 ) ).toEqual( [false, 0, true] );

    fire( runEvents.onAstralSuccess, { id: 7, exitCode: 0 } );

    expect( run.resultDir ).toBe( '/out' );
    expect( finished.seen.at( -1 ) ).toEqual( [true, 0, false] );
    finished.stop();
  } );
} );
