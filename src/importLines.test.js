// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { longImportLines } = require( '../scripts/import-lines' );

it( 'reports a single-line import past 100 characters', () => {
  const long = `import { ${'A'.repeat( 90 )} } from './a';`;
  expect( longImportLines( long ) ).toEqual( [1] );
  expect( longImportLines( 'import {\n  A,\n} from \'./a\';\n' ) ).toEqual( [] );
} );
