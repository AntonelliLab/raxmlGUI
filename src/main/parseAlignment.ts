import path from 'path';

interface AlignmentSequence {
  taxon: string;
}

interface Alignment {
  sequences: AlignmentSequence[];
}

interface AlignmentParseTools {
  readFormat: ( filePath: string ) => Promise<string>;
  convert: ( filePath: string ) => Promise<string>;
  parse: ( filePath: string ) => Promise<Alignment>;
  write: ( filePath: string, alignment: Alignment ) => Promise<void>;
}

interface AlignmentChange {
  newFilePath: string;
  format: string | undefined;
  converted: boolean | undefined;
  modified: boolean | undefined;
  modificationMessages: string[];
}

interface AlignmentParseResult {
  alignment: Alignment;
  change: AlignmentChange | null;
}

export async function parseAlignment(
  _id: string,
  filePath: string,
  tools: AlignmentParseTools,
): Promise<AlignmentParseResult> {
  console.log( 'Parse alignment', filePath );
  const { readFormat, convert, parse, write } = tools;
  let format: string | undefined;
  let newFilePath: string | undefined;
  let converted: boolean | undefined;
  let modified: boolean | undefined;
  const modificationMessages: string[] = [];
  try {
    format = await readFormat( filePath );
    if ( format !== 'fasta' && format !== 'phylip' ) {
      newFilePath = await convert( filePath );
      converted = true;
    }
  } catch ( error: unknown ) {
    console.log( 'error', error );
  }
  const actualPath = newFilePath
    ? newFilePath
    : filePath;
  const alignment = await parse( actualPath );
  const taxons = new Map<string, number>();
  let identicalCounter = 0;
  alignment.sequences.forEach( ( sequence, index ) => {
    if ( sequence.taxon.length > 256 ) {
      const message = `Taxon name is too long: '${sequence.taxon}'.`;
      console.log( message );
      alignment.sequences[index].taxon = sequence.taxon.slice( 0, 253 );
      modified = true;
      modificationMessages.push( message );
    }
    const ind = taxons.get( sequence.taxon );
    if ( ind !== undefined ) {
      const message = `Identical sequence names: ${ind + 1} and ${index + 1} = ${sequence.taxon}`;
      console.log( message );
      identicalCounter += 1;
      alignment.sequences[index].taxon = `${sequence.taxon}_${identicalCounter}`;
      modified = true;
      modificationMessages.push( message );
    }
    const excludedCharacters = [':', ',', '.', '(', ')', '[', ']', ';', "'"];
    const testInvalid = new RegExp( `[\\s${excludedCharacters.map( ( c ) => `\\${c}` ).join( '' )}]`, 'g' );
    if ( testInvalid.test( sequence.taxon ) ) {
      const message = `Illegal characters in sequence name = taxon '${sequence.taxon}' found.`;
      console.log( message );
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
