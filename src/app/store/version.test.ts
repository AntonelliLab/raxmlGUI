import { expect, it, vi } from 'vitest';
import { installBridge } from '../../test/setup';

import AppStore from './AppStore';

it( 'the page learns the app version from getVersion', async () => {
  const getVersion = vi.fn( async () => '2.0.18' );
  installBridge( { getVersion } );
  const store = new AppStore();

  await Promise.all( getVersion.mock.results.map( ( result ) => result.value ) );
  expect( getVersion ).toHaveBeenCalled();
  expect( store.version ).toBe( '2.0.18' );
} );
