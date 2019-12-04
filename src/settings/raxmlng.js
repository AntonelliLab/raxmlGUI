// --model
export const binarySubstitutionModelOptions = {
  default: 'BIN+G',
  options: [
    'BIN',
    'BIN+I',
    'BIN+G',
    'BIN+G+I',
    'BIN+ASC_LEWIS',
    'BIN+G+ASC_LEWIS'
  ]
};

// --model
export const nucleotideSubstitutionModelOptions = {
  default: 'GTR+G',
  options: [
    'GTR',
    'GTR+I',
    'GTR+G',
    'GTR+G+I',
    'GTR+ASC_LEWIS',
    'GTR+G+ASC_LEWIS'
  ]
};

// --model
export const multistateSubstitutionModelOptions = {
  default: 'MULTIx_GTR+G',
  options: [
    'MULTIx_MK',
    'MULTIx_MK+I',
    'MULTIx_MK+G',
    'MULTIx_MK+I+G',
    'MULTIx_MK+ASC_LEWIS',
    'MULTIx_MK+G+ASC_LEWIS',
    'MULTIx_GTR',
    'MULTIx_GTR+I',
    'MULTIx_GTR+G',
    'MULTIx_GTR+I+G',
    'MULTIx_GTR+ASC_LEWIS',
    'MULTIx_GTR+G+ASC_LEWIS',

  ]
};

// --model
export const aminoAcidSubstitutionModelOptions = {
  default: 'Blosum62',
  options: [
    'Blosum62',
    'cpREV',
    'Dayhoff',
    'DCMut',
    'DEN',
    'FLU',
    'HIVb',
    'HIVw',
    'JTT',
    'JTT-DCMut',
    'LG',
    'mtART',
    'mtMAM',
    'mtREV',
    'mtZOA',
    'PMB',
    'rtREV',
    'stmtREV',
    'VT',
    'WAG',
    'LG4M',
    'LG4X',
    'PROTGTR'
  ]
};

export const modelOptions = {
  'protein': aminoAcidSubstitutionModelOptions,
  'binary': binarySubstitutionModelOptions,
  'multistate': multistateSubstitutionModelOptions,
  'dna': nucleotideSubstitutionModelOptions,
  'rna': nucleotideSubstitutionModelOptions,
  'nucleotide': nucleotideSubstitutionModelOptions,
};
