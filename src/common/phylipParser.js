import UserFixError from "./errors";

const rePhylipHeader = /^\s*(\d+)\s+(\d+)(?:\s+([is]))?\s*$/; // 3  78  i (optional i/s for interleaved/sequential)
const reStrictPhylipLine = /^(.{10})(.+)$/;
const reRelaxedPhylipLine = /^(\w+)\s+(.+)$/;


export const isPhylip = (lines) => {
  if (lines.length === 0) {
    throw new Error('No lines');
  }
  return rePhylipHeader.test(lines[0]);
}

//TODO: Make PhylipParserError class
export const parse = (lines) => {

  if (!isPhylip(lines)) {
    throw new Error('First line is not a phylip formatted header');
  }

  const match = rePhylipHeader.exec(lines[0]);
  const numSequences = +match[1];
  const length = +match[2];
  let isInterleaved = false;
  if (match[3] === 'i') {
    isInterleaved = true;
  }

  let firstSeqLineIndex = 1; // Sequences start after header
  let lastSeqLineIndex = lines.length - 1;
  // Trim empty lines around sequences
  while (lines[lastSeqLineIndex].trim() === '') {
    --lastSeqLineIndex;
  }
  if (lastSeqLineIndex === 0) {
    throw new Error('No sequence lines');
  }
  while (lines[firstSeqLineIndex].trim() === '') {
    ++firstSeqLineIndex;
  }
  const numSeqLines = lastSeqLineIndex - firstSeqLineIndex + 1;
  const oneLineSequences = numSeqLines === numSequences;
  console.log(`Start parsing phylip with specified ${numSequences} sequences of length ${length}...`);
  console.log('firstSeqLineIndex:', firstSeqLineIndex, 'lastSeqLineIndex:', lastSeqLineIndex);
  console.log('numSeqLines:', numSeqLines, 'oneLineSequences:', oneLineSequences);

  let numLinesPerTaxa = 1;
  const interleavedStartLineIndices = [];
  if (!oneLineSequences) {
    // Check if sequential or interleaved

    // Interleaved format must have empty lines between interleaved sections
    let lastEmpty = false;
    let currentSectionStartLineIndex = firstSeqLineIndex;
    const assertCorrectNumberOfSeqLines = (startIndex, endIndex) => {
      const numSeq = endIndex + 1 - startIndex;
      if (numSeq !== numSequences) {
        throw new Error(`Interleaved section (lines ${startIndex+1}-${endIndex+1}) doesn't have specified ${numSequences} lines of sequences.`);
      }
    }
    for (let i = firstSeqLineIndex; i <= lastSeqLineIndex; ++i) {
      if (lines[i].trim().length === 0) {
        if (lastEmpty) {
          continue;
        }
        assertCorrectNumberOfSeqLines(currentSectionStartLineIndex, i - 1);
        lastEmpty = true;
      } else {
        if (lastEmpty) {
          interleavedStartLineIndices.push(i);
          currentSectionStartLineIndex = i;
        }
        lastEmpty = false;
      }
    }
    if (interleavedStartLineIndices.length > 0) {
      isInterleaved = true;
      numLinesPerTaxa = interleavedStartLineIndices.length + 1;
      // Also check correct length of last section
      const lastInterleavedStartLineIndex = interleavedStartLineIndices[interleavedStartLineIndices.length - 1];
      assertCorrectNumberOfSeqLines(lastInterleavedStartLineIndex, lastSeqLineIndex);
      console.log('interleavedStartLineIndices:', interleavedStartLineIndices);
    }
    else {
      // Should be sequential
      if (isInterleaved) {
        throw new Error(`File is specified as interleaved in header but no empty lines separating interleaved sections found`);
      }
      // Is sequential, check consistent number of lines for each taxa
      // (the total number of sequence lines should be a multiple of the number of sequences specified)
      numLinesPerTaxa = 1;
      while (numSeqLines > numLinesPerTaxa * numSequences) {
        ++numLinesPerTaxa;
      }
      if (numSeqLines !== numLinesPerTaxa * numSequences) {
        throw new Error(`Inferred sequential phylip format because of no empty lines between sequences, but the number of sequence lines (${numSeqLines}) is not a multiple of the specified number of sequences (${numSequences}).`);
      }
      console.log(`Is sequential format with ${numLinesPerTaxa} consecutive lines for each sequence`);
    }
  }
  const numConsequtiveLinesPerTaxa = isInterleaved ? 1 : numLinesPerTaxa;

  // Discern if strict or relaxed format, first some helper methods
  const getLineIndex = (seqIndex, subLineIndex = 0) => {
    const startLineIndex = firstSeqLineIndex + seqIndex * numConsequtiveLinesPerTaxa;
    if (subLineIndex === 0) {
      return startLineIndex;
    }
    if (!isInterleaved) {
      return startLineIndex + subLineIndex;
    }
    return interleavedStartLineIndices[subLineIndex - 1];
  }
  const getSeqLine = (seqIndex, subLineIndex = 0) => {
    return lines[getLineIndex(seqIndex, subLineIndex)];
  }
  const getSeqLines = (seqIndex) => {
    const seqLines = [];
    for (let i = 0; i < numLinesPerTaxa; ++i) {
      seqLines.push(getSeqLine(seqIndex, i));
    }
    return seqLines;
  }

  const parseSeqAssumingStrictName = (seqIndex) => {
    const line = getSeqLines(seqIndex).join('');
    const taxon = line.substring(0, 10).trim();
    let code = line.substring(10);
    // Replace possible single spaces within sequence, separating for example ten characters each
    code = code.replace(/(?<=\S)\s+/g, "");
    return { taxon, code };
  }
  const parseSeqAssumingRelaxedName = (seqIndex) => {
    const line = getSeqLines(seqIndex).join('');
    let [taxon, ...code] = line.split(/\s+/);
    code = code.join('');
    return { taxon, code };
  }
  const checkIsRelaxed = () => {
    console.log(`Checking if strict or relaxed from first sequence...`);
    // Check the length of the code part assuming strict and relaxe and see which matches
    const seqIfStrict = parseSeqAssumingStrictName(0);
    if (seqIfStrict.code.length === length) {
      console.log('Is strict phylip format! First sequence:', seqIfStrict);
      return false;
    }
    const seqIfRelaxed = parseSeqAssumingRelaxedName(0);
    if (seqIfRelaxed.code.length === length) {
      console.log('Is relaxed phylip format! First sequence:', seqIfRelaxed);
      return true;
    }
    throw new Error(`Can't find specified ${length} number of characters for first sequence. Assuming relaxed format gives length ${seqIfRelaxed.code.length} (${JSON.stringify(seqIfRelaxed)}) and assuming strict format gives length ${seqIfStrict.code.length} (${JSON.stringify(seqIfStrict)})`);
  }
  const isRelaxed = checkIsRelaxed();

  // Parse sequences
  const sequences = [];
  const parseSequence = isRelaxed ? parseSeqAssumingRelaxedName : parseSeqAssumingStrictName;
  for (let seqIndex = 0; seqIndex < numSequences; ++seqIndex) {
    const seq = parseSequence(seqIndex);
    let hasExcluded = false;
    const excludedCharacters = [' ', ':', ',', '.', '(', ')', '[', ']', ';', "'"];
    excludedCharacters.map(ex => {
      hasExcluded = hasExcluded || seq.taxon.includes(ex);
      return true;
    })
    if (hasExcluded) {
      throw new UserFixError(`Alignment contains illegal character in taxon names. Illegal characters in taxon-names are: tabulators, carriage returns, spaces, ":", ",", ".", ")", "(", ";", "]", "[", "'". Please remove those characters from your alignment.`);
    }
    if (seq.code.length !== length) {
      throw new Error(`Length ${seq.code.length} of sequence ${seqIndex + 1} (parsed taxon name '${seq.taxon}' and code '${seq.code}') doesn't match specified length of ${length}.`);
    }
    sequences.push(seq);
  }

  // console.log('Sequences:', sequences);
  const alignment = {
    sequences,
    numSequences,
    length,
    fileFormat: 'PHYLIP',
    interleaved: isInterleaved,
    relaxed: isRelaxed,
    numLinesPerTaxa,
  };

  return alignment;
}

export default {
  isPhylip,
  parse,
};
