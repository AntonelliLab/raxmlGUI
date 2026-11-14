import fs from 'fs';
import readline from 'readline';
import util from 'util';
import phylipParser from './phylipParser';
import fastaParser from './fastaParser';
import typecheckAlignment from './typecheckAlignment';
import UserFixError from './errors';

interface AlignmentSequence {
  taxon: string;
  code: string;
}

interface Alignment {
  sequences: AlignmentSequence[];
}

export const parseAlignment = async ( filePath: string ): Promise<Alignment> => {
  return new Promise( ( resolve, reject ) => {
    const rl = readline.createInterface( {
      input: fs.createReadStream( filePath ),
      terminal: false,
    } );
    const lines: string[] = [];
    let error: Error | null = null;
    let alignment: Alignment | null = null;
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
        try {
          typecheckAlignment( alignment );
        } catch ( err: unknown ) {
          console.error( 'Error checking data type:', err );
          return reject( err );
        }
        const alignmentRestricted = Object.assign( {}, alignment, {
          sequences: alignment.sequences.slice( 0, 2 ),
        } );
        console.log( 'Alignment with first two sequences:', alignmentRestricted );
        resolve( alignment );
      }
    } );
  } );
};

export const writeAlignment = async ( filePath: string, alignment: Alignment ): Promise<void> => {
  console.log( `Write alignment in FASTA format to ${filePath}` );
  console.log( alignment );
  const writeStream = fs.createWriteStream( filePath );
  const write = util.promisify( writeStream.write );
  const end = util.promisify( writeStream.end );
  for ( let i = 0; i < alignment.sequences.length; ++i ) {
    const prefix = i === 0
      ? '>'
      : '\n>';
    const sequence = alignment.sequences[i];
    await write.call( writeStream, `${prefix}${sequence.taxon}\n` );
    await write.call( writeStream, sequence.code );
  }
  await end.call( writeStream );
};

interface Io {
  parseAlignment: ( filePath: string ) => Promise<Alignment>;
  writeAlignment: ( filePath: string, alignment: Alignment ) => Promise<void>;
}

const io: Io = {
  parseAlignment,
  writeAlignment,
};

export default io;
