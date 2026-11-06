/*
  RAxML-NG --model-related options used by the renderer store.
*/

export type RaxmlNgLabelledOption = {
  value: string;
  label: string;
};

type RaxmlNgSubstitutionModelOptions = {
  default: string;
  options: readonly string[];
};

type RaxmlNgLabelledOptions = {
  options: readonly RaxmlNgLabelledOption[];
};

// --model
export const binarySubstitutionModelOptions = {
  default: 'BIN',
  options: ['BIN'],
} as const satisfies RaxmlNgSubstitutionModelOptions;

// --model
export const nucleotideSubstitutionModelOptions = {
  default: 'GTR',
  options: [
    'JC',
    'K80',
    'F81',
    'HKY',
    'TN93ef',
    'TN93',
    'K81',
    'K81uf',
    'TPM2',
    'TPM2uf',
    'TPM3',
    'TPM3uf',
    'TIM1',
    'TIM1uf',
    'TIM2',
    'TIM2uf',
    'TIM3',
    'TIM3uf',
    'TVMef',
    'TVM',
    'SYM',
    'GTR',
  ],
} as const satisfies RaxmlNgSubstitutionModelOptions;

// --model
export const multistateSubstitutionModelOptions = {
  default: 'MULTIx_GTR',
  options: ['MULTIx_MK', 'MULTIx_GTR'],
} as const satisfies RaxmlNgSubstitutionModelOptions;

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
    'PROTGTR',
  ],
} as const satisfies RaxmlNgSubstitutionModelOptions;

// --model
export const stationaryFrequenciesOptions = {
  options: [
    {
      value: '+F',
      label: '+F (empirical)',
    },
    {
      value: '+FO',
      label: '+FO (ML estimate)',
    },
    {
      value: '+FE',
      label: '+FE (equal)',
    },
    // Also posibble are user defined values
    // +FU{f1/f2/../fn} (user-defined: f1 f2 ... fn)
    // +FU{freqs.txt} (user-defined from file)
  ],
} as const satisfies RaxmlNgLabelledOptions;

// --model
export const proportionOfInvariantSitesOptions = {
  options: [
    {
      value: '+I',
      label: '+I (ML estimate)',
    },
    {
      value: '+IC',
      label: '+IC (empirical)',
    },
    // Also posibble are user defined values
    // +IU{p} (user-defined: p)
  ],
} as const satisfies RaxmlNgLabelledOptions;

// --model
export const amongsiteRateHeterogeneityModelOptions = {
  options: [
    {
      value: '+G',
      label: '+GAMMA (mean)',
    },
    {
      value: '+GA',
      label: '+GAMMA (median)',
    },
    // Also posibble are user defined values
    // +Gn (discrete GAMMA with n categories', 'ML estimate of alpha)
    // +Gn{a} (discrete GAMMA with n categories and user-defined alpha a)
    // +Rn (FreeRate with n categories', 'ML estimate of rates and weights)
    // +Rn{r1/r2/../rn}{w1/w2/../wn} (FreeRate with n categories', 'user-defined rates r1 r2 ... rn and weights w1 w2 ... wn)
  ],
} as const satisfies RaxmlNgLabelledOptions;

// --model
export const ascertainmentBiasCorrectionOptions = {
  options: [
    {
      value: '+ASC_LEWIS',
      label: "Lewis' method",
    },
    // Also posibble are user defined values
    // +ASC_FELS{w} (Felsenstein's method with total number of invariable sites w)
    // +ASC_STAM{w1/w2/../wn} (Stamatakis' method with per-state invariable site numbers w1 w2 ... wn)
  ],
} as const satisfies RaxmlNgLabelledOptions;

export const modelOptions = {
  protein: aminoAcidSubstitutionModelOptions,
  binary: binarySubstitutionModelOptions,
  multistate: multistateSubstitutionModelOptions,
  dna: nucleotideSubstitutionModelOptions,
  rna: nucleotideSubstitutionModelOptions,
  nucleotide: nucleotideSubstitutionModelOptions,
} as const satisfies {
  protein: typeof aminoAcidSubstitutionModelOptions;
  binary: typeof binarySubstitutionModelOptions;
  multistate: typeof multistateSubstitutionModelOptions;
  dna: typeof nucleotideSubstitutionModelOptions;
  rna: typeof nucleotideSubstitutionModelOptions;
  nucleotide: typeof nucleotideSubstitutionModelOptions;
};
