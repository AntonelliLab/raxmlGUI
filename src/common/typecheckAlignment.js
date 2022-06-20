import UserFixError from './errors';

export const getFinalDataType = (dataTypes) => {
  const notUndefinedTypes = dataTypes.filter((d) => d !== undefined);
  if (notUndefinedTypes.length === 0) {
    return undefined;
  }
  let firstType = notUndefinedTypes[0];
  for (let i = 1; i < notUndefinedTypes.length; ++i) {
    const type = notUndefinedTypes[i];
    if (type !== firstType) {
      if (
        (type === 'binary' && firstType === 'multistate') ||
        (type === 'multistate' && firstType === 'binary')
      ) {
        firstType = 'multistate';
      } else {
        return 'mixed';
      }
    }
  }
  return firstType;
};

// Valid characters taken from Standard-RAxML (axml.c)
const reInvalidBinary = /[^01-?]/g;
const reInvalidDNA = /[^ABCDGHKMRSTUVWYNOX?-]/gi;
const reInvalidAA = /[^ARNDCQEGHILKMFPSTWYVBZX*?-]/gi;
const reInvalidGeneric = /[^0123456789ABCDEFGHIJKLMNOPQRSTU?-]/gi;
const reInvalidMixed = /[^0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*?-]/gi;

export function findInvalidCharacter(code, dataType) {
  // Returns the index of the invalid character if found, else -1
  switch (dataType) {
    case 'protein':
      return reInvalidAA.test(code) ? reInvalidAA.lastIndex - 1 : -1;
    case 'nucleotide':
      return reInvalidDNA.test(code) ? reInvalidDNA.lastIndex - 1 : -1;
    case 'multistate':
      return reInvalidGeneric.test(code) ? reInvalidGeneric.lastIndex - 1 : -1;
    case 'binary':
      return reInvalidBinary.test(code) ? reInvalidBinary.lastIndex - 1 : -1;
    case 'unknown':
    case 'mixed':
    default:
      return reInvalidMixed.test(code) ? reInvalidMixed.lastIndex - 1 : -1;
  }
}

function isInvariant(code) {
  const firstSite = code[0];
  for (const site of code) {
    if (site !== firstSite) {
      return false;
    }
  }
  return true;
}

function hasInvariantSites(sequences) {
  for (const seq of sequences) {
    if (isInvariant(seq.code)) {
      return true;
    }
  }
  return false;
}

export default function typecheckAlignment(alignment) {
  const acgMatch = /[ACGN?]/i; // Include 'N' and '?' as symbols for missing characters in DNA
  // const proteinMatch = /[RNDEQHILKMFPSWYVXBZJ]/i;
  const proteinMatch = /[EFJIJLOPQZX]/i;
  const binaryMatch = /[01]/;
  const multistateMatch = /2/;
  const unknownMatch = /^[N?]+$/i;
  const sequenceDataTypes = [];
  const dataTypes = new Set();
  let numSequencesTypechecked = 0;
  alignment.sequences.forEach((sequence, index) => {
    const { code } = sequence;
    let dataType = undefined;
    if (proteinMatch.test(code)) {
      dataType = 'protein';
    } else if (acgMatch.test(code)) {
      // const numT = (code.match(/T/ig) || []).length;
      // const numU = (code.match(/U/ig) || []).length;
      // if (numT > numU) {
      //   dataType = 'dna';
      // } else {
      //   dataType = 'rna';
      // }
      if (/[ACG]/i.test(code)) {
        // Check that it don't have only N or ?
        dataType = 'nucleotide';
      } else {
        dataType = 'unknown';
      }
    }

    if (!dataType || dataType === 'unknown') {
      if (multistateMatch.test(code)) {
        dataType = 'multistate';
      } else if (binaryMatch.test(code)) {
        dataType = 'binary';
      } else if (unknownMatch.test(code)) {
        dataType = 'unknown';
      }
    } else if (binaryMatch.test(code) || multistateMatch.test(code)) {
      dataType = 'mixed';
    }
    dataTypes.add(dataType);
    sequence.dataType = dataType;
    ++numSequencesTypechecked;
    sequenceDataTypes.push(sequence.dataType);
  });

  if (dataTypes.delete('unknown')) {
    console.log('At least one sequence have only unknown characters');
    if (dataTypes.size === 0) {
      throw new Error(
        `Invalid alignment: cannot determine data type because all ${numSequencesTypechecked} sequences are of type unknown`
      );
    }
  }
  let dataType = dataTypes.values().next().value;
  if (dataTypes.size > 1) {
    // Only valid case with different types is binary and multistate as [01] is a subset of [012].
    const isMultistate = !sequenceDataTypes.find(
      (type) => type !== 'binary' && type !== 'multistate'
    );
    if (isMultistate) {
      dataType = 'multistate';
    } else {
      dataType = 'invalid';
      console.log(
        'Illegal mix of data types among sequences:',
        sequenceDataTypes
      );
      throw new UserFixError(
        `Your alignment is a mix of different data types, namely = ${Array.from(
          dataTypes.keys()
        )}. 
        Please use only the same type for one alignment or combine several files.`
      );
    }
  }
  alignment.sequences.forEach((seq, index) => {
    const invalidSiteIndex = findInvalidCharacter(seq.code, dataType);
    if (invalidSiteIndex !== -1) {
      const sample =
        seq.code.length <= 8
          ? `'${seq.code}'`
          : `'${seq.code.substring(0, 8)}'...`;
      throw new UserFixError(
        `Invalid character '${seq.code[invalidSiteIndex]}' at site ${
          invalidSiteIndex + 1
        } in sequence ${
          index + 1
        } (${sample}) for inferred data type '${dataType}'`
      );
    }
  });
  alignment.hasInvariantSites = hasInvariantSites(alignment.sequences);
  alignment.dataType = dataType;
  alignment.typecheckingComplete = true;
  return alignment;
}
