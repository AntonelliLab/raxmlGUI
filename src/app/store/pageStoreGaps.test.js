// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';
import RunList from './RunList';

let bridge;

beforeEach( () => {
  bridge = {
    cancelModelSelection: jest.fn(),
    parseAlignment: () => new Promise( () => {} ),
  };
  window.rendererBridge = bridge;
} );

function makeRun() {
  const parent = { onError: jest.fn(), deleteRun: jest.fn() };
  const run = new Run( parent, 7 );
  run.addAlignments( [{ path: '/data/a.fasta' }, { path: '/data/b.fasta' }] );
  return { run, parent };
}

describe( 'cancelModeltestOnAlignment', () => {
  it( 'cancels the model selection of each loading alignment only', () => {
    const { run } = makeRun();
    const [ loading, idle ] = run.alignments;
    runInAction( () => { loading.modeltestLoading = true; } );

    run.cancelModeltestOnAlignment();

    expect( loading.modeltestLoading ).toBe( false );
    expect( run.modelTestIsRunningOnAlignment ).toBe( false );
    expect( bridge.cancelModelSelection ).toHaveBeenCalledTimes( 1 );
    expect( bridge.cancelModelSelection ).toHaveBeenCalledWith( loading.id );
    expect( idle.modeltestLoading ).toBe( false );
  } );
} );

describe( 'clearShowModified', () => {
  it( 'hides the modified snack and dialog on every alignment', () => {
    const { run } = makeRun();
    runInAction( () => {
      run.alignments.forEach( ( a ) => {
        a.showModifiedSnack = true;
        a.showModifiedDialog = true;
      } );
    } );

    run.clearShowModified();

    run.alignments.forEach( ( a ) => {
      expect( a.showModifiedSnack ).toBe( false );
      expect( a.showModifiedDialog ).toBe( false );
    } );
  } );
} );

describe( 'removeRun', () => {
  it( 'asks the run list to delete this run', () => {
    const { run, parent } = makeRun();

    run.removeRun();

    expect( parent.deleteRun ).toHaveBeenCalledWith( run );
  } );

  it( 'removes the run from a real run list', () => {
    const list = new RunList();
    list.addRun();
    const [ first, second ] = list.runs;

    second.removeRun();

    expect( list.runs ).toEqual( [ first ] );
  } );
} );

describe( 'disableCheckUndeterminedSequence', () => {
  it( 'is observed by the run: the -O argument follows it', () => {
    const { run } = makeRun();
    runInAction( () => { run.binary.value = 'raxmlHPC'; } );
    // analysis is a computed that builds its option; keep it observed so a set value sticks.
    const keepAnalysis = autorun( () => run.analysis );
    runInAction( () => { run.analysis.value = 'FT'; } );
    const seen = [];
    const stop = autorun( () => seen.push( run.args.flat().includes( '-O' ) ) );

    runInAction( () => { run.disableCheckUndeterminedSequence = false; } );
    runInAction( () => { run.disableCheckUndeterminedSequence = true; } );
    stop();
    keepAnalysis();

    expect( seen ).toEqual( [ true, false, true ] );
  } );
} );
