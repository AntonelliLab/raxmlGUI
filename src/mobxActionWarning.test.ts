// @ts-nocheck — the test is not typed yet.
import { describe, expect, test } from 'vitest';
import { observable, runInAction, autorun } from 'mobx';

import { actionWarnings } from './test/mobxActionWarning';

function observed() {
  const box = observable.box( 0 );
  const stop = autorun( () => box.get() );
  return { box, stop };
}

describe( 'MobX action warning check', () => {
  test( 'a write inside runInAction passes', () => {
    const { box, stop } = observed();
    runInAction( () => box.set( 1 ) );
    stop();
    expect( actionWarnings() ).toHaveLength( 0 );
  } );

  test( 'a write outside an action is collected, and would fail the test', () => {
    const { box, stop } = observed();
    box.set( 1 );
    stop();
    expect( actionWarnings() ).toHaveLength( 1 );
    actionWarnings().length = 0; // consumed here, so the global afterEach does not fail this proof
  } );
} );
