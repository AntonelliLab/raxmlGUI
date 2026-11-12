import fs from 'fs';
import { serializeError } from 'serialize-error';

export async function checkOutput( { outputDir, outputName } ) {
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
    const filterResultFilenames = ( filename ) => filename.startsWith( `${outputNameUnused}.raxml.` ) ||
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
  } catch ( error ) {
    return {
      outputDir,
      outputName,
      ok: false,
      notice: error.message,
      outputNameUnused: outputName,
      error: serializeError( error ),
      resultFilenames: [],
    };
  }
}
