// @ts-nocheck — Jest globals. checkJs has no test runner types.
import AppStore from './AppStore';

it( 'the page learns the app version from getVersion', async () => {
  const getVersion = jest.fn( async () => '2.0.18' );
  window.rendererBridge = { getVersion };
  const store = new AppStore();

  await Promise.all( getVersion.mock.results.map( ( result ) => result.value ) );
  expect( getVersion ).toHaveBeenCalled();
  expect( store.version ).toBe( '2.0.18' );
} );
