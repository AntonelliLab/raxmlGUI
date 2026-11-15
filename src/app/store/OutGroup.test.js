// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import RunList from './RunList';
import { runEvents } from './StoreBase';

// A run subscribes to bridge events when it is created.
beforeEach( () => {
  const bridge = { cancelRun: jest.fn(), getVersion: () => Promise.resolve( '2.0.0' ) };
  for ( const name of Object.values( runEvents ) ) {
    bridge[name] = () => () => {};
  }
  window.rendererBridge = bridge;
} );

const newRun = () => new RunList().activeRun;

const setAlignments = ( run, taxons ) => runInAction( () => {
  run.alignments = [{ taxons }];
} );

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

describe( 'OutGroup', () => {
  it( 'starts at none', () => {
    const { outGroup } = newRun();
    expect( outGroup.value ).toEqual( ['<none>'] );
    expect( outGroup.multiple ).toBe( true );
    expect( outGroup.cmdValue ).toBe( '' );
  } );

  it( 'options are none followed by the taxa, and follow the alignments', () => {
    const run = newRun();
    const { seen, stop } = track( () => run.outGroup.options.map( ( o ) => o.value ) );
    setAlignments( run, ['a', 'b'] );
    expect( run.outGroup.options ).toEqual( [
      { value: '<none>', title: '<none>' },
      { value: 'a', title: 'a' },
      { value: 'b', title: 'b' },
    ] );
    expect( seen ).toEqual( [['<none>'], ['<none>', 'a', 'b']] );
    stop();
  } );

  describe( 'setValue', () => {
    it( 'choosing a taxon clears none', () => {
      const { outGroup } = newRun();
      outGroup.setValue( ['<none>', 'a'] );
      expect( outGroup.value ).toEqual( ['a'] );
    } );

    it( 'choosing none clears the taxa', () => {
      const { outGroup } = newRun();
      outGroup.setValue( ['a', 'b'] );
      outGroup.setValue( ['a', 'b', '<none>'] );
      expect( outGroup.value ).toEqual( ['<none>'] );
    } );

    it( 'keeps several taxa', () => {
      const { outGroup } = newRun();
      outGroup.setValue( ['a', 'b'] );
      expect( outGroup.value ).toEqual( ['a', 'b'] );
    } );
  } );

  it( 'reset returns to none', () => {
    const { outGroup } = newRun();
    outGroup.setValue( ['a'] );
    outGroup.reset();
    expect( outGroup.value ).toEqual( ['<none>'] );
    expect( outGroup.isDefault ).toBe( false ); // default is an array compared by identity
  } );

  it( 'cmdValue is empty for none and comma-joined for taxa, and follows value', () => {
    const { outGroup } = newRun();
    const { seen, stop } = track( () => outGroup.cmdValue );
    runInAction( () => {
      outGroup.value = ['a', 'b'];
    } );
    runInAction( () => {
      outGroup.value = ['<none>'];
    } );
    expect( seen ).toEqual( ['', 'a,b', ''] );
    stop();
  } );

  it( 'notAvailable follows alignments and the analysis', () => {
    const run = newRun();
    const { seen, stop } = track( () => run.outGroup.notAvailable );
    expect( run.outGroup.notAvailable ).toBe( true ); // no alignments
    setAlignments( run, ['a'] );
    expect( run.outGroup.notAvailable ).toBe( false ); // default analysis takes an outgroup
    runInAction( () => {
      run.analysis.value = 'AS'; // takes no outgroup
    } );
    expect( run.outGroup.notAvailable ).toBe( true );
    expect( seen ).toEqual( [true, false, true] );
    stop();
  } );
} );
