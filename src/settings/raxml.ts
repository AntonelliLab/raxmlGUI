/*
  RAxML substitution-related options used by the renderer store. (CLI flag
  catalog was removed; nothing imported it.)
*/

// -K
export const kMultistateSubstitutionModelOptions = {
  argument: 'K',
  default: 'GTR',
  options: ['ORDERED', 'MK', 'GTR'],
} as const;

export const mixedSubstitutionMatrixOptions = {
  default: 'GTR',
  options: ['GTR', 'BIN', 'MULTI'],
} as const;

// -m
export const binarySubstitutionMatrixOptions = {
  argument: 'm',
  default: 'BIN',
  options: ['BIN'],
} as const;

export const nucleotideSubstitutionMatrixOptions = {
  default: 'GTR',
  options: ['JC', 'K80', 'HKY', 'GTR'],
} as const;

export const rateOptions = {
  default: 'GAMMA',
  options: ['CAT', 'GAMMA'],
} as const;

export const iOptions = {
  default: 'none',
  options: ['none', '+I (ML estimate)'],
} as const;

export const ascertainmentOptions = {
  default: 'none',
  options: [
    'none',
    "Lewis' method",
    "Felsenstein's method",
    "Stamatakis' method",
  ],
} as const;

// -m
export const multistateSubstitutionMatrixOptions = {
  default: 'MULTI',
  options: ['MULTI'],
} as const;

// -m
export const aminoAcidSubstitutionMatrixOptions = {
  argument: 'm',
  default: 'BLOSUM62',
  options: [
    'DAYHOFF',
    'DCMUT',
    'JTT',
    'MTREV',
    'WAG',
    'RTREV',
    'CPREV',
    'VT',
    'BLOSUM62',
    'MTMAM',
    'LG',
    'MTART',
    'MTZOA',
    'PMB',
    'HIVB',
    'HIVW',
    'JTTDCMUT',
    'FLU',
    'STMTREV',
    'DUMMY',
    'DUMMY2',
    'AUTO',
    'LG4M',
    'LG4X',
    'PROT_FILE',
    'GTR_UNLINKED',
    'GTR',
  ],
} as const;

export const matrixOptions = {
  protein: aminoAcidSubstitutionMatrixOptions,
  binary: binarySubstitutionMatrixOptions,
  mixed: mixedSubstitutionMatrixOptions,
  multistate: multistateSubstitutionMatrixOptions,
  dna: nucleotideSubstitutionMatrixOptions,
  rna: nucleotideSubstitutionMatrixOptions,
  nucleotide: nucleotideSubstitutionMatrixOptions,
};
