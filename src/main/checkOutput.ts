import fs from 'fs';
import { serializeError } from 'serialize-error';
import type { ErrorObject } from 'serialize-error';
import * as ipc from '../constants/ipc';

interface CheckOutputArgs {
  outputDir: string;
  outputName: string;
}

interface CheckOutputResult {
  outputDir: string;
  outputName: string;
  ok: boolean;
  notice: string;
  outputNameUnused: string;
  resultFilenames: string[];
  error?: ErrorObject;
}

export async function checkOutput(
  { outputDir, outputName }: CheckOutputArgs,
): Promise<CheckOutputResult> {
  const outputFilename = `${outputName}.tre`;
  console.log( 'Check unused filename:', outputFilename );
  if ( !outputDir ) {
    return {
      outputDir,
      outputName,
      ok: true,
      notice: '',
      outputNameUnused: outputName,
      resultFilenames: [],
    };
  }
  try {
    const filenames = await fs.promises.readdir( outputDir );
    let outputNameUnused = outputName;
    const filterResultFilenames = ( filename: string ): boolean => filename.startsWith( `${outputNameUnused}.raxml.` ) ||
      filename.endsWith( outputNameUnused ) ||
      filename.endsWith( `.${outputNameUnused}.txt` ) ||
      filename.endsWith( `${outputNameUnused}.tre` );
    const resultFilenames = filenames.filter( filterResultFilenames ).concat(
      filenames.filter( ( filename ) => filename.startsWith( `RAxML_GUI_ModelTest_${outputNameUnused}.` ) ||
        filename.startsWith( `RAxML_GUI_Settings_${outputNameUnused}.` ) ),
    );
    let counter = 1;
    const matchCounterName = /(\w+)_\d+$/.exec( outputName );
    const outputNameWithoutCounter = matchCounterName
      ? matchCounterName[1]
      : outputName;
    while ( filenames.find( filterResultFilenames ) ) {
      outputNameUnused = `${outputNameWithoutCounter}_${counter}`;
      ++counter;
    }
    const ok = outputName === outputNameUnused;
    return {
      outputDir,
      outputName,
      ok,
      notice: ok
        ? ''
        : `Using '${outputNameUnused}'`,
      outputNameUnused,
      resultFilenames,
    };
  } catch ( error: unknown ) {
    console.log( ipc.OUTPUT_CHECK, 'error:', error );
    return {
      outputDir,
      outputName,
      ok: false,
      notice: ( error as Error ).message,
      outputNameUnused: outputName,
      error: serializeError( error ),
      resultFilenames: [],
    };
  }
}
