// @ts-nocheck — Jest globals. checkJs has no test runner types.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { checkOutput } from './checkOutput';

it( 'checkOutput reports a taken name, the free id, and the result files', async () => {
  const outputDir = fs.mkdtempSync( path.join( os.tmpdir(), 'raxml-out-' ) );
  try {
    fs.writeFileSync( path.join( outputDir, 'tree.raxml.log' ), '' );
    fs.writeFileSync( path.join( outputDir, 'tree_1.raxml.log' ), '' );
    fs.writeFileSync( path.join( outputDir, 'RAxML_GUI_ModelTest_tree.out' ), '' );
    fs.writeFileSync( path.join( outputDir, 'notes.txt' ), '' );

    const result = await checkOutput( { outputDir, outputName: 'tree' } );

    expect( result ).toEqual( {
      outputDir,
      outputName: 'tree',
      ok: false,
      notice: "Using 'tree_2'",
      outputNameUnused: 'tree_2',
      resultFilenames: ['tree.raxml.log', 'RAxML_GUI_ModelTest_tree.out'],
    } );
  } finally {
    fs.rmSync( outputDir, { recursive: true } );
  }
} );

it( 'a directory that cannot be read resolves as a failed check', async () => {
  const outputDir = path.join( os.tmpdir(), `raxml-missing-${process.pid}` );
  const notice = `ENOENT: no such file or directory, scandir '${outputDir}'`;

  const result = await checkOutput( { outputDir, outputName: 'tree' } );

  expect( result ).toEqual( {
    outputDir,
    outputName: 'tree',
    ok: false,
    notice,
    outputNameUnused: 'tree',
    error: expect.objectContaining( { message: notice } ),
    resultFilenames: [],
  } );
} );

it( 'no output directory yet is a free name', async () => {
  const result = await checkOutput( { outputDir: '', outputName: 'tree' } );

  expect( result ).toEqual( {
    outputDir: '',
    outputName: 'tree',
    ok: true,
    notice: '',
    outputNameUnused: 'tree',
    resultFilenames: [],
  } );
} );
