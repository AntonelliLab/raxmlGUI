// @vitest-environment node
import { expect, it } from 'vitest';
import io from './io';

it( 'parseAlignment rejects a missing file with a user-fix error naming the file', async () => {
  await expect( io.parseAlignment( 'Tt-5.fas' ) ).rejects.toMatchObject( {
    isUserFix: true,
    message: expect.stringContaining( "'Tt-5.fas' does not exist" ),
  } );
} );
