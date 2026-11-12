import path from 'path';

export async function parseAlignment( _id, filePath, tools ) {
  const { readFormat, convert, parse, write } = tools;
  let format;
  let newFilePath;
  let converted;
  let modified;
  const modificationMessages = [];
  try {
    format = await readFormat( filePath );
    if ( format !== 'fasta' && format !== 'phylip' ) {
      newFilePath = await convert( filePath );
      converted = true;
    }
  } catch ( error ) {
    console.log( 'error', error );
  }
  const actualPath = newFilePath
    ? newFilePath
    : filePath;
  const alignment = await parse( actualPath );
  const taxons = new Map();
  let identicalCounter = 0;
  alignment.sequences.forEach( ( sequence, index ) => {
    if ( sequence.taxon.length > 256 ) {
      const message = `Taxon name is too long: '${sequence.taxon}'.`;
      alignment.sequences[index].taxon = sequence.taxon.slice( 0, 253 );
      modified = true;
      modificationMessages.push( message );
    }
    const ind = taxons.get( sequence.taxon );
    if ( ind !== undefined ) {
      const message = `Identical sequence names: ${ind + 1} and ${index + 1} = ${sequence.taxon}`;
      identicalCounter += 1;
      alignment.sequences[index].taxon = `${sequence.taxon}_${identicalCounter}`;
      modified = true;
      modificationMessages.push( message );
    }
    const excludedCharacters = [':', ',', '.', '(', ')', '[', ']', ';', "'"];
    const testInvalid = new RegExp( `[\\s${excludedCharacters.map( ( c ) => `\\${c}` ).join( '' )}]`, 'g' );
    if ( testInvalid.test( sequence.taxon ) ) {
      const message = `Illegal characters in sequence name = taxon '${sequence.taxon}' found.`;
      alignment.sequences[index].taxon = sequence.taxon.replace( testInvalid, '_' );
      modified = true;
      modificationMessages.push( message );
    }
    taxons.set( sequence.taxon, index );
  } );
  if ( modified ) {
    const baseName = path.basename( actualPath, path.extname( actualPath ) );
    newFilePath = actualPath.replace( baseName, `${baseName}_modified` );
    await write( newFilePath, alignment );
  }
  const change = newFilePath
    ? {
      newFilePath,
      format,
      converted,
      modified,
      modificationMessages,
    }
    : null;
  return { alignment, change };
}
