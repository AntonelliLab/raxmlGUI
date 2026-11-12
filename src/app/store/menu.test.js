// @ts-nocheck — Jest globals. checkJs has no test runner types.
import RunList from './RunList';

function bridge() {
  const listeners = {};
  const subscribe = ( key ) => ( listener ) => {
    listeners[key] = listener;
    return () => {};
  };
  window.rendererBridge = {
    onAddRun: subscribe( 'add' ),
    onRemoveRun: subscribe( 'remove' ),
    onLightMode: subscribe( 'light' ),
    onDarkMode: subscribe( 'dark' ),
    onToggleBackboneConstraint: subscribe( 'backbone' ),
    onToggleMultifurcatingConstraint: subscribe( 'multifurcating' ),
  };
  return listeners;
}

it( 'onAddRun and onRemoveRun update the page runs', () => {
  const listeners = bridge();
  const runs = new RunList();

  listeners.add();
  expect( runs.runs ).toHaveLength( 2 );

  listeners.remove();
  expect( runs.runs ).toHaveLength( 1 );
} );

it( 'onLightMode and onDarkMode update the page theme', () => {
  const listeners = bridge();
  const runs = new RunList();

  listeners.dark();
  expect( runs.config.isDarkMode ).toBe( true );

  listeners.light();
  expect( runs.config.isDarkMode ).toBe( false );
} );

it( 'onToggleBackboneConstraint and onToggleMultifurcatingConstraint update those constraints', () => {
  const listeners = bridge();
  const runs = new RunList();

  listeners.backbone();
  expect( runs.activeRun.useBackboneConstraint ).toBe( true );
  listeners.backbone();
  expect( runs.activeRun.useBackboneConstraint ).toBe( false );

  listeners.multifurcating();
  expect( runs.activeRun.useMultifurcatingConstraint ).toBe( true );
  listeners.multifurcating();
  expect( runs.activeRun.useMultifurcatingConstraint ).toBe( false );
} );
