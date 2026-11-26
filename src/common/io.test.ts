// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, it } from 'vitest';
import io from './io';

it( 'writeAlignment writes every sequence as FASTA', async () => {
  const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'io-test-' ) );
  try {
    const filePath = path.join( dir, 'out.fas' );
    await io.writeAlignment( filePath, {
      sequences: [{ taxon: 'a', code: 'ACGT' }, { taxon: 'b', code: 'TTGA' }],
      length: 4,
    } );
    expect( fs.readFileSync( filePath, 'utf8' ) ).toBe( '>a\nACGT\n>b\nTTGA' );
  } finally {
    fs.rmSync( dir, { recursive: true, force: true } );
  }
} );

it( 'parseAlignment rejects a missing file with a user-fix error naming the file', async () => {
  await expect( io.parseAlignment( 'Tt-5.fas' ) ).rejects.toMatchObject( {
    isUserFix: true,
    message: expect.stringContaining( "'Tt-5.fas' does not exist" ),
  } );
} );
