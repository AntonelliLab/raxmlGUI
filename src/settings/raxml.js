const ON = true;
const OFF = false;

/*
    JavaScript representation of the possible settings for the RAxML binary
*/

/*
    Multi-state settings
*/

// -A
export const secondaryStructureOptions = [
  'S6A',
  'S6B',
  'S6C',
  'S6D',
  'S6E',
  'S7A',
  'S7B',
  'S7C',
  'S7D',
  'S7E',
  'S7F',
  'S16', // default
  'S16A',
  'S16B'
];

// -f
export const algorithmOptions = [
  'a',
  'A',
  'b',
  'B',
  'c',
  'C',
  'd', // default
  'D',
  'e',
  'E',
  'F',
  'g',
  'G',
  'h',
  'H',
  'i',
  'I',
  'j',
  'J',
  'k',
  'm',
  'n',
  'N',
  'o',
  'p',
  'P',
  'q',
  'r',
  'R',
  's',
  'S',
  't',
  'T',
  'u',
  'v',
  'V',
  'w',
  'W',
  'x',
  'y'
];

// -I
export const bootstoppingOptions = ['autoFC', 'autoMR', 'autoMRE', 'autoMRE_IGN'];

// -J
export const consensusTreeOptions = ['MR', 'MRE', 'STRICT', 'T_'];

// -K
export const kMultistateSubstitutionModelOptions = {
  argument: 'K',
  default: 'GTR',
  options: ['ORDERED', 'MK', 'GTR']
};

// -m
export const mixedSubstitutionModelOptions = {
  argument: 'm',
  default: 'GTRGAMMA',
  options: [
    'GTRCAT',
    'GTRCATI',
    'GTRGAMMA',
    'GTRGAMMAI',
    'BINCAT',
    'BINCATI',
    'BINGAMMA',
    'BINGAMMAI',
    'MULTICAT',
    'MULTICATI',
    'MULTIGAMMA',
    'MULTIGAMMAI',
  ],
};

export const mixedSubstitutionMatrixOptions = {
  default: 'GTR',
  options: [
    'GTR',
    'BIN',
    'MULTI',
  ],
};

// -m
export const binarySubstitutionModelOptions = {
  argument: 'm',
  default: 'BINGAMMA',
  options: [
    'BINCAT',
    'BINCATI',
    'ASC_BINCAT',
    'BINGAMMA',
    'BINGAMMAI',
    'ASC_BINGAMMA',
  ],
};

// -m
export const binarySubstitutionMatrixOptions = {
  argument: 'm',
  default: 'BIN',
  options: [
    'BIN',
  ],
};

// -m
export const nucleotideSubstitutionModelOptions = {
  argument: 'm',
  default: 'GTRGAMMA',
  options: [
    'JCGAMMA',
    'JCGAMMAI',
    'K80GAMMA',
    'K80GAMMAI',
    'HKYGAMMA',
    'HKYGAMMAI',
    'GTRCAT',
    'GTRCATI',
    'ASC_GTRCAT',
    'GTRGAMMA',
    'GTRGAMMAI',
    'ASC_GTRGAMMA',
  ],
};

export const nucleotideSubstitutionMatrixOptions = {
  default: 'GTR',
  options: ['JC', 'K80', 'HKY', 'GTR'],
};

export const rateOptions = {
  default: 'GAMMA',
  options: ['CAT', 'GAMMA'],
};

export const iOptions = {
  default: 'none',
  options: ['none', '+I (ML estimate)'],
};

export const ascertainmentOptions = {
  default: 'none',
  options: [
    'none',
    "Lewis' method",
    "Felsenstein's method",
    "Stamatakis' method",
  ],
};

// -m
export const multistateSubstitutionModelOptions = {
  argument: 'm',
  default: 'MULTIGAMMA',
  options: [
    'MULTICAT',
    'MULTICATI',
    'ASC_MULTICAT',
    'MULTIGAMMA',
    'MULTIGAMMAI',
    'ASC_MULTIGAMMA'
  ]
};

// -m
export const multistateSubstitutionMatrixOptions = {
  default: 'MULTI',
  options: [
    'MULTI',
  ],
};

// -m
export const aminoAcidSubstitutionModelOptions = {
  argument: 'm',
  default: 'PROTGAMMA',
  options: [
    'PROTCAT',
    'PROTCATI',
    'ASC_PROTCAT',
    'PROTGAMMA',
    'PROTGAMMAI',
    'ASC_PROTGAMMA'
  ]
};

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
    'GTR'
  ]
};

export const modelOptions = {
  'protein': aminoAcidSubstitutionModelOptions,
  'binary': binarySubstitutionModelOptions,
  'mixed': mixedSubstitutionModelOptions,
  'multistate': multistateSubstitutionModelOptions,
  'dna': nucleotideSubstitutionModelOptions,
  'rna': nucleotideSubstitutionModelOptions,
  'nucleotide': nucleotideSubstitutionModelOptions,
};

export const matrixOptions = {
  protein: aminoAcidSubstitutionMatrixOptions,
  binary: binarySubstitutionMatrixOptions,
  mixed: mixedSubstitutionMatrixOptions,
  multistate: multistateSubstitutionMatrixOptions,
  dna: nucleotideSubstitutionMatrixOptions,
  rna: nucleotideSubstitutionMatrixOptions,
  nucleotide: nucleotideSubstitutionMatrixOptions,
};


// -N
export const numberRunsOptions = {
  argument: 'N',
  default: 1,
  options: [1, 10, 20, 50, 100, 500]
};

// -N
export const numberRepsOptions = {
  argument: 'N',
  default: 100,
  options: [
    100,
    200,
    500,
    1000,
    10000,
    'autoMR',
    'autoMRE',
    'autoMRE_IGN',
    'autoFC'
  ]
};

// --asc-corr
export const asscertainmentBiasCorrectionOptions = [
  'lewis',
  'felsenstein',
  'stamatakis'
];

// --auto-prot
export const automaticProteinModelSelectionOptions = ['ml', 'bic', 'aic', 'aicc'];

/*
    Boolean settings
*/

// -C
// default OFF
export const verboseOutputOption = OFF;

// -d
// default OFF
export const randomMLStartingTreeOption = OFF;

// -D
// default OFF
export const convergenceCriterionMLOption = OFF;

// -F
// default OFF
export const enableCATLargeTreesOption = OFF;

// -H
// default ON
export const disablePatternCompressionOption = ON;

// -j
// default OFF
export const intermediateTreesToFileOption = OFF;

// -k
// default OFF
export const printBranchLengthsBootstrapOption = {
  argument: 'k',
  default: OFF
};

// -M
// default OFF
export const estimationPerPartitionBranchLengthsOption = OFF;

// -O
// default OFF
export const disableUndeterminedSequenceCheckOption = OFF;

// -u
// default OFF
export const medianDiscreteApproximationOption = OFF;

// -V
// default OFF
export const disableRateHeterogeneityOption = OFF;

// -X
// default OFF
export const computeSuperficialStartingTreeOnlyOption = OFF;

// -y
// default OFF
export const computeStartingTreeOnlyOption = OFF;

// --mesquite
// default OFF
export const printMesquiteOutputOption = OFF;

// --silent
// default OFF
// TODO not sure if this should be exposed
export const disablePrintoutOption = OFF;

// --no-seq-check
// default OFF
export const disableSequenceChecksOption = OFF;

// --no-bfgs
// default OFF
export const disableBFGSOption = OFF;

// --flag-check
// default OFF
export const flagCheckOption = OFF;

// --JC69
// default OFF
export const jukesCantorOption = OFF;

// --K80
// default OFF
export const kimuraOption = OFF;

/*
    Integer settings
*/

// -b
export const randomSeedBootstrapOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256
};

// -c
export const distinctRateCatgeoriesOption = {
  min: 0,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: 25
};

// -p
export const randomSeedParsimonyOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: Date.now()
};

// -T
export const numberThreadsOption = {
  argument: 'T',
  min: 1,
  // TODO does a max and default value make sense?
  defaultValue: 1
  // TODO max value has to be checked dynamically with number of CPUs present
};

// -x
export const randomSeedRapidBootstrapOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: Date.now()
};

// --epa-keep-placements
export const epaKeepPlacementsOption = {
  min: 1,
  // TODO what is max
  defaultValue: 7
};

/*
    Double settings
*/

// -B
export const bootstopCutoffOption = {
  min: 0,
  max: 1,
  defaultValue: 0.03
};

// -e
export const modelOptimizationPrecisionOption = {
  // TODO check min max
  min: 0.0,
  max: 0.1,
  defaultValue: 0.1
};

// TODO not sure if this is a double setting, not specified in help
// -G
export const evolutionaryPlacementAlgorithmOption = {
  min: 0.0,
  max: 1.0
};

// --epa-prob-threshold
export const epaPropThresholdOption = {
  min: 0.0,
  max: 1.0,
  defaultValue: 0.01
};

/*
    String settings
*/

// -E
export const excludeFileNameOption = { defaultValue: '' };

// -g
export const multifurcatingConstraintTreeFileNameOption = { defaultValue: '' };

// -n
// Can not be empty per default
export const outputFileNameOption = { defaultValue: 'output' };

// -o
export const outgroupNameOption = { defaultValue: '' };

// -P
export const aminoAcidSubstitutionModelFileNameOption = { defaultValue: '' };

// -q
export const multipleModelsFileNameOption = { defaultValue: '' };

// -r
export const binaryConstraintTreeFileNameOption = { defaultValue: '' };

// -R
export const binaryModelParamFileNameOption = { defaultValue: '' };

// -s
// Can not be empty per default
export const alignmentFileNameOption = { defaultValue: 'input' };

// -S
export const secondaryStructureFileNameOption = { defaultValue: '' };

// -t
export const startingTreeFileNameOption = { defaultValue: '' };

// -Y
export const quartetGroupingFileNameOption = { defaultValue: '' };

// -z
export const multipleTreeFileNameOption = { defaultValue: '' };

/*
    TODO unclear settings
*/
// -i
// -L
// -U probably boolean but default unclear
// -w String setting, unclear yet how to handle the default that is used when the arg is not given
// -W Integer?
// --epa-accumulated-threshold Integer or Double (unclear to me)
