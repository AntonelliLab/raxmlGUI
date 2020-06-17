
export const getFinalDataType = (dataTypes) => {
  const notUndefinedTypes = dataTypes.filter(d => d !== undefined);
  if (notUndefinedTypes.length === 0) {
    return undefined;
  }
  let firstType = notUndefinedTypes[0];
  for (let i = 1; i < notUndefinedTypes.length; ++i) {
    const type = notUndefinedTypes[i];
    if (type !== firstType) {
      if ((type === 'binary' && firstType === 'multistate') || (type === 'multistate' && firstType === 'binary')) {
        firstType = 'multistate';
      } else {
        return 'mixed';
      }
    }
  }
  return firstType;
}


// Valid characters taken from Standard-RAxML (axml.c)
const reInvalidBinary = /[^01-?]/g;
const reInvalidDNA = /[^ABCDGHKMRSTUVWYNOX?-]/g;
const reInvalidAA = /[^ARNDCQEGHILKMFPSTWYVBZX*?-]/g;
const reInvalidGeneric = /[^0123456789ABCDEFGHIJKLMNOPQRSTU?-]/g;
const reInvalidMixed = /[^0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*?-]/g;

export function findInvalidCharacter(code, dataType) {
  // Returns the position of the invalid character if found, else -1
  switch (dataType) {
    case 'protein':
      return reInvalidAA.test(code) ? reInvalidAA.lastIndex : -1;
    case 'nucleotide':
      return reInvalidDNA.test(code) ? reInvalidDNA.lastIndex : -1;
    case 'multistate':
      return reInvalidGeneric.test(code) ? reInvalidGeneric.lastIndex : -1;
    case 'binary':
      return reInvalidBinary.test(code) ? reInvalidBinary.lastIndex : -1;
    case 'unknown':
    case 'mixed':
      return reInvalidMixed.test(code) ? reInvalidMixed.lastIndex : -1;
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
  const acgMatch = /[ACG]/i;
  // const proteinMatch = /[RNDEQHILKMFPSWYVXBZJ]/i;
  const proteinMatch = /[EFJIJLOPQZX]/i;
  const binaryMatch = /[01]/;
  const multistateMatch = /2/;
  const unknownMatch = /^\?+$/;
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
      dataType = 'nucleotide';
    }

    if (!dataType) {
      if (multistateMatch.test(code)) {
        dataType = 'multistate';
      }
      else if (binaryMatch.test(code)) {
        dataType = 'binary';
      } else if (unknownMatch.test(code)) {
        dataType = 'unknown';
      }
    } else if (binaryMatch.test(code) || multistateMatch.test(code)) {
      dataType = 'mixed';
    }
    const invalidSite = findInvalidCharacter(code, dataType);
    if (invalidSite !== -1) {
      throw new Error(`Invalid character in sequence ${index+1} at site ${invalidSite}`);
    }
    dataTypes.add(dataType);
    sequence.dataType = dataType;
    ++numSequencesTypechecked;
    sequenceDataTypes.push(sequence.dataType);
  })

  if (dataTypes.delete('unknown')) {
    console.log('At least one sequence have only unknown characters');
    if (dataTypes.size === 0) {
      throw new Error(`Invalid alignment: cannot determine data type because all ${numSequencesTypechecked} sequences are of type unknown`);
    }
  }
  let dataType = dataTypes.values().next().value;
  if (dataTypes.size > 1) {
    // Only valid case with different types is binary and multistate as [01] is a subset of [012].
    const isMultistate = !sequenceDataTypes.find(type => type !== 'binary' && type !== 'multistate');
    if (isMultistate) {
      dataType = 'multistate';
    }
    else {
      dataType = 'invalid';
      console.log('Illegal mix of data types among sequences:', sequenceDataTypes);
      throw new Error(`Invalid alignment: sequences must be of same data type, but found [${Array.from(dataTypes.keys())}].`);
    }
  }
  alignment.hasInvariantSites = hasInvariantSites(alignment.sequences);
  alignment.dataType = dataType;
  alignment.typecheckingComplete = true;
  return alignment;
}
