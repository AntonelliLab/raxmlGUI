
export default function typecheckAlignment(alignment) {
  const acgMatch = /[ACG]/i;
  const proteinMatch = /[EFIJLOPQZX\*]/i;
  const binaryMatch = /[01]/i;
  const multistateMatch = /2/i;
  const sequenceDataTypes = [];
  let numSequencesTypechecked = 0;
  for (const sequence of alignment.sequences) {
    const { code } = sequence;
    let dataType = undefined;
    if (proteinMatch.test(code)) {
      dataType = 'protein';
    } else if (acgMatch.test(code)) {
      const numT = (code.match(/T/ig) || []).length;
      const numU = (code.match(/U/ig) || []).length;
      if (numT > numU) {
        dataType = 'dna';
      } else {
        dataType = 'rna';
      }
    }

    const isBinary = binaryMatch.test(code);
    const isMultistate = multistateMatch.test(code);
    if (!dataType) {
      dataType = isMultistate ? 'multistate' : (isBinary ? 'binary' : undefined);
    } else if (isBinary || isMultistate) {
      dataType = 'mixed';
    }
    sequence.dataType = dataType;
    ++numSequencesTypechecked;
    sequenceDataTypes.push(sequence.dataType);
  }

  let dataType = sequenceDataTypes[0];
  const differentTypes = sequenceDataTypes.filter(type => type !== dataType);
  if (differentTypes.length > 0) {
    // Only valid case with different types is binary and multistate as [01] is a subset of [012].
    const isInvalid = sequenceDataTypes.find(type => type !== 'binary' && type !== 'multistate');
    dataType = isInvalid ? 'invalid' : 'multistate';
  }
  alignment.dataType = dataType;
  alignment.typecheckingComplete = true;
  return alignment;
}
