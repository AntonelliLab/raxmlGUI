import { expect, it } from 'vitest';

import { stubBridge } from '../../test/storeBridge';

import RunList from './RunList';

// The run list subscribes to the menu events; stubBridge keeps each listener so a test can fire it.
function bridge() {
  return stubBridge().fire;
}

it( 'onAddRun and onRemoveRun update the page runs', () => {
  const fire = bridge();
  const runs = new RunList();

  fire( 'onAddRun' );
  expect( runs.runs ).toHaveLength( 2 );

  fire( 'onRemoveRun' );
  expect( runs.runs ).toHaveLength( 1 );
} );

it( 'onToggleBackboneConstraint and onToggleMultifurcatingConstraint update those constraints', () => {
  const fire = bridge();
  const runs = new RunList();

  fire( 'onToggleBackboneConstraint' );
  expect( runs.activeRun.useBackboneConstraint ).toBe( true );
  fire( 'onToggleBackboneConstraint' );
  expect( runs.activeRun.useBackboneConstraint ).toBe( false );

  fire( 'onToggleMultifurcatingConstraint' );
  expect( runs.activeRun.useMultifurcatingConstraint ).toBe( true );
  fire( 'onToggleMultifurcatingConstraint' );
  expect( runs.activeRun.useMultifurcatingConstraint ).toBe( false );
} );
