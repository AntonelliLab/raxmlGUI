
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

export default function typecheckAlignment(alignment) {
  const acgMatch = /[ACG]/i;
  // const proteinMatch = /[RNDEQHILKMFPSWYVXBZJ]/i;
  const proteinMatch = /[EFJIJLOPQZX]/i;
  const binaryMatch = /[01]/i;
  const multistateMatch = /2/i;
  const unknownMatch = /^\?+$/;
  const sequenceDataTypes = [];
  const dataTypes = new Set();
  let numSequencesTypechecked = 0;
  for (const sequence of alignment.sequences) {
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
    dataTypes.add(dataType);
    sequence.dataType = dataType;
    ++numSequencesTypechecked;
    sequenceDataTypes.push(sequence.dataType);
  }

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
  alignment.dataType = dataType;
  alignment.typecheckingComplete = true;
  return alignment;
}
