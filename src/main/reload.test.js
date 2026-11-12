// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { reload } from './reload';

it( 'reload reloads the calling window', () => {
  const calling = { reload: jest.fn() };

  reload( calling );

  expect( calling.reload ).toHaveBeenCalledTimes( 1 );
} );
