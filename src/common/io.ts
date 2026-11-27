import fs from 'fs';
import readline from 'readline';
import util from 'util';
import phylipParser from './phylipParser';
import fastaParser from './fastaParser';
import typecheckAlignment from './typecheckAlignment';
import type { TypecheckedAlignment } from './typecheckAlignment';
import type { FastaAlignment } from './fastaParser';
import type { PhylipAlignment } from './phylipParser';
import UserFixError from './errors';

interface AlignmentSequence {
  taxon: string;
  code: string;
}

interface Alignment {
  sequences: AlignmentSequence[];
  length: number;
}

export const parseAlignment = async ( filePath: string ): Promise<TypecheckedAlignment> => {
  try {
    await fs.promises.access( filePath );
  } catch ( err: unknown ) {
    if ( ( err as NodeJS.ErrnoException ).code !== 'ENOENT' ) {
      throw err;
    }
    throw new UserFixError( `The alignment file '${filePath}' does not exist. It may have been moved, renamed or deleted after it was added: ${( err as Error ).message}` );
  }
  return new Promise( ( resolve, reject ) => {
    const rl = readline.createInterface( {
      input: fs.createReadStream( filePath ),
      terminal: false,
    } );
    const lines: string[] = [];
    let error: Error | null = null;
    let alignment: FastaAlignment | PhylipAlignment | null = null;
    rl.on( 'line', ( line ) => {
      lines.push( line );
    } ).on( 'close', () => {
      try {
        if ( phylipParser.isPhylip( lines ) ) {
          alignment = phylipParser.parse( lines );
        } else if ( fastaParser.isFasta( lines ) ) {
          alignment = fastaParser.parse( lines );
        } else {
          throw new UserFixError( "Unrecognized input format. RaxmlGUI2 supports the following input types at the moment: 'clustal', 'fasta', 'nbrf', 'nexus', 'mega', 'phylip'." );
        }
      } catch ( err: unknown ) {
        const parseError = err as Error;
        parseError.message = `Error parsing file ${filePath}: ${parseError.message}.`;
        error = parseError;
      }
      if ( error ) {
        reject( error );
      } else {
        if ( !alignment || alignment.sequences.length === 0 ) {
          return reject( new Error( `Couldn't parse any sequences from file ${filePath}` ) );
        }
        let typechecked: TypecheckedAlignment;
        try {
          typechecked = typecheckAlignment( alignment );
        } catch ( err: unknown ) {
          console.error( 'Error checking data type:', err );
          return reject( err );
        }
        const alignmentRestricted = Object.assign( {}, typechecked, {
          sequences: typechecked.sequences.slice( 0, 2 ),
        } );
        console.log( 'Alignment with first two sequences:', alignmentRestricted );
        resolve( typechecked );
      }
    } );
  } );
};

export const writeAlignment = async ( filePath: string, alignment: Alignment ): Promise<void> => {
  console.log( `Write alignment in FASTA format to ${filePath}` );
  console.log( alignment );
  const writeStream = fs.createWriteStream( filePath );
  const write = util.promisify(
    ( chunk: string, cb: ( err?: Error | null ) => void ) => writeStream.write( chunk, cb ),
  );
  const end = util.promisify( ( cb: () => void ) => writeStream.end( cb ) );
  for ( let i = 0; i < alignment.sequences.length; ++i ) {
    const prefix = i === 0
      ? '>'
      : '\n>';
    const sequence = alignment.sequences[i];
    await write( `${prefix}${sequence.taxon}\n` );
    await write( sequence.code );
  }
  await end();
};

interface Io {
  parseAlignment: ( filePath: string ) => Promise<TypecheckedAlignment>;
  writeAlignment: ( filePath: string, alignment: Alignment ) => Promise<void>;
}

const io: Io = {
  parseAlignment,
  writeAlignment,
};

export default io;
