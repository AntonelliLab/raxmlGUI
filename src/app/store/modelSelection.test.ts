import { expect, it, vi } from 'vitest';
import { runInAction } from 'mobx';
import type { RendererBridge } from '../../common/rendererBridge';
import { installBridge } from '../../test/setup';

import Run from './Run';
import { runEvents } from './StoreBase';

// The run reads only onError from its parent here, so the stand-in is partial.
type RunParent = ConstructorParameters<typeof Run>[0];
const parent = { onError() {} } as Partial<RunParent> as RunParent;
// Every bridge listener fits this, whatever payload its event carries.
type Listener = ( payload: never ) => void;

function bridge( extra: Partial<RendererBridge> = {} ) {
  const listeners: Record<'success' | 'failure', Listener[]> = {
    success: [],
    failure: [],
  };
  const stops: string[] = [];
  const subscribe = ( key: 'success' | 'failure' ) => ( listener: Listener ) => {
    listeners[key].push( listener );
    return () => {
      stops.push( key );
    };
  };
  installBridge( {
    parseAlignment: () => new Promise( () => {} ),
    [runEvents.onModelSelectionSuccess]: subscribe( 'success' ),
    [runEvents.onModelSelectionFailure]: subscribe( 'failure' ),
    ...extra,
  } );
  return { listeners, stops };
}

function emit( list: Listener[], payload: unknown ) {
  list.forEach( ( listener ) => listener( payload as never ) );
}

it( 'startModelSelection starts model selection', async () => {
  const startModelSelection = vi.fn( async () => {} );
  bridge( { startModelSelection } );
  const run = new Run( parent, 7 );
  run.setOutputDir( '/out' );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  runInAction( () => {
    alignment.numSequences = 4;
    alignment.dataType = 'nucleotide';
  } );

  await alignment.runModelTest();

  expect( alignment.modeltestLoading ).toBe( true );
  expect( startModelSelection ).toHaveBeenCalledWith( {
    id: '7_/data/primates.fasta',
    filePath: '/data/primates.fasta',
    outputDir: '/out',
    dataType: 'nucleotide',
    numThreads: 2,
    binaryName: run.modeltestName,
  } );
} );

it( 'a model selection result sets the model', () => {
  const { listeners, stops } = bridge();
  const run = new Run( parent, 7 );
  run.running = true;
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  alignment.modeltestLoading = true;
  const result = { raxml: 'GTRGAMMA', extraFlag: '--HKY85', raxmlNG: 'HKY+G' };

  emit( listeners.success, { id: 'other', result } );
  expect( alignment.substitutionModel.value ).toBe( '' );
  expect( alignment.modeltestLoading ).toBe( true );

  emit( listeners.success, { id: alignment.id, result } );
  expect( alignment.substitutionModel.value ).toBe( 'HKY' );
  expect( run.substitutionMatrix.value ).toBe( 'HKY' );
  expect( alignment.modeltestLoading ).toBe( false );
  expect( run.running ).toBe( false );

  alignment.dispose();
  expect( stops.slice().sort() ).toEqual( ['failure', 'success'] );
} );

it( 'the model-selection cancel control uses cancelModelSelection', () => {
  const cancelModelSelection = vi.fn();
  bridge( { cancelModelSelection } );
  const run = new Run( parent, 7 );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  alignment.modeltestLoading = true;

  alignment.cancelModelTest();

  expect( cancelModelSelection ).toHaveBeenCalledWith( '7_/data/primates.fasta' );
  expect( alignment.modeltestLoading ).toBe( false );
} );

it( 'a model selection failure shows the error', () => {
  const { listeners } = bridge();
  const run = new Run( parent, 7 );
  run.running = true;
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  alignment.modeltestLoading = true;

  emit( listeners.failure, { id: 'other', error: 'ignore' } );
  expect( run.error ).toBe( null );
  expect( alignment.modeltestLoading ).toBe( true );

  emit( listeners.failure, { id: alignment.id, error: 'missing binary' } );
  expect( run.error ).toBe( 'missing binary' );
  expect( alignment.modeltestLoading ).toBe( false );
  expect( run.running ).toBe( false );
} );
