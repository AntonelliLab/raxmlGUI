import fs from 'fs';
import readline from 'readline';
import util from 'util';

import phylipParser from './phylipParser';
import fastaParser from './fastaParser';
import typecheckAlignment from './typecheckAlignment';
import UserFixError from './errors';

export const parseAlignment = async (filePath) => {

  return new Promise((resolve, reject) => {

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      terminal: false,
    });

    const lines = [];
    let error = null;
    let alignment = null;

    rl.on('line', (line) => {
      lines.push(line);

    }).on('close', () => {
      try {
        if (phylipParser.isPhylip(lines)) {
          alignment = phylipParser.parse(lines);
        } else if (fastaParser.isFasta(lines)) {
          alignment = fastaParser.parse(lines);
        } else {
          throw new UserFixError("Unrecognized input format. RaxmlGUI2 supports the following input types at the moment: 'clustal', 'fasta', 'nbrf', 'nexus', 'mega', 'phylip'.");
        }
      }
      catch (err) {
        error = err;
        error.message = `Error parsing file ${filePath}: ${error.message}.`;
      }
      if (error) {
        reject(error);
      } else {

        if (alignment.sequences.length === 0) {
          return reject(new Error(`Couldn't parse any sequences from file ${filePath}`))
        }

        try {
          typecheckAlignment(alignment);
        } catch (err) {
          console.error('Error checking data type:', err);
          return reject(err);
        }

        // Check if duplicate or invalid taxon names
        const taxons = new Map();
        alignment.sequences.forEach(({ taxon }, index) => {
          const ind = taxons.get(taxon);
          if (ind !== undefined) {
            return reject(new UserFixError(`Sequence names of taxon ${ind+1} and ${index+1} are identical, they are both called ${taxon}. Please make sure each sequence has a unique name.`));
          }

          // If the taxon name has one of those characters raxml will error out
          const excludedCharacters = [':', ',', '.', '(', ')', '[', ']', ';', "'"];
          // Test white-space characters and excluded characters above
          const testInvalid = new RegExp(`[\\s${excludedCharacters.map(c => `\\${c}`).join('')}]`);
          if (testInvalid.test(taxon)) {
            return reject(new UserFixError(`Taxon '${taxon}' in sequence ${index+1} contains illegal characters. Illegal characters in taxon-names are: tabulators, carriage returns, spaces, ${excludedCharacters.map(c => `"${c}"`).join(', ')}. Please remove those characters from your alignment.`));
          }
          // If the taxon name is longer than 256 characters raxml will error out
          if (taxon.length > 256) {
            return reject(new UserFixError(`The taxon name in sequence ${index+1} is too long. RAxML only allows lengths up to 256 characters. Taxon name has length ${taxon.length}: '${taxon}'`));
          }
          taxons.set(taxon, index);
        });


        const alignmentRestricted = Object.assign({}, alignment, { sequences: alignment.sequences.slice(0,2) });
        console.log('Alignment with first two sequences:', alignmentRestricted);
        resolve(alignment);
      }
    });
  });
}

export const writeAlignment = async (filePath, alignment) => {
  console.log(`Write alignment in FASTA format to ${filePath}`);
  console.log(alignment);
  const writeStream = fs.createWriteStream(filePath);
  const write = util.promisify(writeStream.write);
  const end = util.promisify(writeStream.end);
  for (let i = 0; i < alignment.sequences.length; ++i) {
    const prefix = i === 0 ? '>' : '\n>';
    const sequence = alignment.sequences[i];
    await write.call(writeStream, `${prefix}${sequence.taxon}\n`);
    await write.call(writeStream, sequence.code);
  }
  await end.call(writeStream);
}

export default {
  parseAlignment,
  writeAlignment,
}
