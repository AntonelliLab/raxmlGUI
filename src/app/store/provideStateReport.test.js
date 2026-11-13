// @ts-nocheck — Jest globals. checkJs has no test runner types.

it( 'provideStateReport registers the store report once', () => {
  const provideStateReport = jest.fn();
  window.rendererBridge = { provideStateReport };

  let store;
  jest.isolateModules( () => {
    store = require( './index' ).default;
  } );

  expect( provideStateReport ).toHaveBeenCalledTimes( 1 );
  const fn = provideStateReport.mock.calls[0][0];
  expect( fn() ).toEqual( store.generateReport() );
} );
