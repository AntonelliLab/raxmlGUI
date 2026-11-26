import { expect, it } from 'vitest';

import { userFixMessage } from './binaryErrors';

// Stdout tails from the upstream reports.
it.each( [
  ['Taxon Name too long at taxon 392, adapt constant nmlngth in\r\naxml.h, current setting 256\r\n', 'the name of taxon 392 is too long (the limit is 256 characters)'],
  ['it will now try to parse it as FASTA file\r\n\r\nERROR: Bad base (_) at site 99 of sequence 1\r\n', 'bad base (_) at site 99 of sequence 1'],
  ['it will now try to parse it as FASTA file\n\nTOO FEW SPECIES\n', 'fewer than 4 sequences'],
  ['\nERROR: Your alignment contains less than 4 sequences! \n\nERROR: Alignment check failed (see details above)!\n\n', 'fewer than 4 sequences'],
  ['must be used in the order they are available, i.e.\r\n0, 1, 2, 3, V\r\nYou are using the following characters: \r\n1 2 3 4 \r\n', 'in the order they are available (0, 1, 2, 3, V), but the alignment uses 1 2 3 4.'],
  ['\nERROR: Error loading MSA: cannot parse any format supported by RAxML-NG!\nPlease re-run', 'cannot parse any format supported by RAxML-NG'],
  ['The file /out/RAxML_info.x RAxML wants to open for writing or appending can not be opened [mode: wb], exiting ...', "output file '/out/RAxML_info.x'"],
] )( 'userFixMessage names the cause in %j', ( stdout, expected ) => {
  expect( userFixMessage( stdout ) ).toContain( expected );
} );

it( 'userFixMessage returns undefined for unknown output', () => {
  expect( userFixMessage( 'Segmentation fault\n' ) ).toBeUndefined();
} );
