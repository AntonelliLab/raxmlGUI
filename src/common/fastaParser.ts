import UserFixError from './errors';

export interface FastaSequence { taxon: string; code: string }

export interface FastaAlignment {
  sequences: FastaSequence[];
  numSequences: number;
  length: number;
  fileFormat: 'FASTA';
}

export const isFasta = (lines: string[]): boolean => {
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[0].trim();
    if (line.length === 0 || line[0] === '#') {
      continue;
    }
    if (line[0] === '>') {
      return true;
    }
  }
  return false;
};

export const parse = (lines: string[]): FastaAlignment => {
  if (!isFasta(lines)) {
    throw new Error(`Could not parse the file as a FASTA file`);
  }

  let lineIndex = 0;

  const parseTaxon = (line: string): string => {
    if (line[0] !== '>') {
      throw new Error(`Expected a '>' to start a taxon line`);
    }
    const taxon = line.substring(1);
    if (!taxon) {
      throw new Error(`Empty taxon at line ${lineIndex + 1}`);
    }
    return taxon;
  };
  const parseCode = (line: string): string => {
    const code = line.replace(/\s+/g, '');
    if (!code) {
      throw new Error(`Empty sequence at line ${lineIndex + 1}`);
    }
    return code;
  };

  const sequences: FastaSequence[] = [];
  let taxon = '';
  let codeLines: string[] = [];

  const addSequence = () => {
    const code = codeLines.join('');
    sequences.push({ taxon, code });
    codeLines = [];
  };

  for (; lineIndex < lines.length; ++lineIndex) {
    const line = lines[lineIndex];
    if (line.length === 0 || line[0] === '#') {
      continue;
    }
    if (line[0] === '>') {
      if (taxon) {
        addSequence();
        codeLines = [];
      }
      taxon = parseTaxon(line);
    } else {
      if (!taxon) {
        throw new Error(
          `'No taxon line found before line ${lineIndex + 1} ('${line}')`,
        );
      }
      codeLines.push(parseCode(line));
    }
  }
  addSequence();

  const numSequences = sequences.length;
  const {length} = sequences[0].code;
  // Check that all sequnces have the same length;
  for (const seq of sequences) {
    if (seq.code.length !== length) {
      throw new UserFixError(
        `Sequence '${seq.taxon}' has different length (${seq.code.length}) than previous taxons (${length})`,
      );
    }
  }

  // console.log('Sequences:', sequences);
  const alignment: FastaAlignment = {
    sequences,
    numSequences,
    length,
    fileFormat: 'FASTA',
  };

  return alignment;
};

export default {
  isFasta,
  parse,
};
