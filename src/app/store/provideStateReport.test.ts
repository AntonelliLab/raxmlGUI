import { expect, it, vi } from 'vitest';

import { installBridge } from '../../test/setup';

it( 'provideStateReport registers the store report once', async () => {
  const provideStateReport = vi.fn();
  installBridge( { provideStateReport } );

  vi.resetModules();
  const store = ( await import( './index' ) ).default;

  expect( provideStateReport ).toHaveBeenCalledTimes( 1 );
  const fn = provideStateReport.mock.calls[0][0];
  expect( fn() ).toEqual( store.generateReport() );
} );
