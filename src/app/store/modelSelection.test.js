// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';
import { runEvents } from './StoreBase';

function bridge( extra ) {
  const listeners = {
    success: [],
    failure: [],
  };
  const stops = [];
  const subscribe = ( key ) => ( listener ) => {
    listeners[key].push( listener );
    return () => {
      stops.push( key );
    };
  };
  window.rendererBridge = {
    parseAlignment: () => new Promise( () => {} ),
    [runEvents.onModelSelectionSuccess]: subscribe( 'success' ),
    [runEvents.onModelSelectionFailure]: subscribe( 'failure' ),
    ...extra,
  };
  return { listeners, stops };
}

function emit( list, payload ) {
  list.forEach( ( listener ) => listener( payload ) );
}

it( 'startModelSelection starts model selection', async () => {
  const startModelSelection = jest.fn( async () => {} );
  bridge( { startModelSelection } );
  const run = new Run( { onError() {} }, 7 );
  run.setOutputDir( '/out' );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  alignment.numSequences = 4;
  alignment.dataType = 'nucleotide';

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
  const run = new Run( { onError() {} }, 7 );
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
  const cancelModelSelection = jest.fn();
  bridge( { cancelModelSelection } );
  const run = new Run( { onError() {} }, 7 );
  run.addAlignments( [{ path: '/data/primates.fasta' }] );
  const alignment = run.alignments[0];
  alignment.modeltestLoading = true;

  alignment.cancelModelTest();

  expect( cancelModelSelection ).toHaveBeenCalledWith( '7_/data/primates.fasta' );
  expect( alignment.modeltestLoading ).toBe( false );
} );

it( 'a model selection failure shows the error', () => {
  const { listeners } = bridge();
  const run = new Run( { onError() {} }, 7 );
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
