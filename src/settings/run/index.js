const ON = true;
const OFF = false;

/*
    JavaScript representation of the possible settings for the RAxML binary
*/

/*
    Multi-state settings
*/

// -A
const secondaryStructureOptions = [
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
const algorithmOptions = [
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
const bootstoppingOptions = ['autoFC', 'autoMR', 'autoMRE', 'autoMRE_IGN'];

// -J
const consensusTreeOptions = ['MR', 'MRE', 'STRICT', 'T_'];

// -K
const kMultistateSubstitutionModelOptions = {
  argument: 'K',
  default: 'GTR',
  options: ['ORDERED', 'MK', 'GTR']
};

// -m
const mixedSubstitutionModelOptions = {
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
    'MULTIGAMMAI'
  ]
};

// -m
const binarySubstitutionModelOptions = {
  argument: 'm',
  default: 'BINGAMMA',
  options: [
    'BINCAT',
    'BINCATI',
    'ASC_BINCAT',
    'BINGAMMA',
    'BINGAMMAI',
    'ASC_BINGAMMA'
  ]
};

// -m
const nucleotideSubstitutionModelOptions = {
  argument: 'm',
  default: 'GTRGAMMA',
  options: [
    'GTRCAT',
    'GTRCATI',
    'ASC_GTRCAT',
    'GTRGAMMA',
    'GTRGAMMAI',
    'ASC_GTRGAMMA'
  ]
};

// -m
const multistateSubstitutionModelOptions = {
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
const aminoAcidSubstitutionModelOptions = {
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
const aminoAcidSubstitutionMatrixOptions = {
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

// -N
const numberRunsOptions = {
  argument: 'N',
  default: 1,
  options: [1, 10, 20, 50, 100, 500]
};

// -N
const numberRepsOptions = {
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
const asscertainmentBiasCorrectionOptions = [
  'lewis',
  'felsenstein',
  'stamatakis'
];

// --auto-prot
const automaticProteinModelSelectionOptions = ['ml', 'bic', 'aic', 'aicc'];

/*
    Boolean settings
*/

// -C
// default OFF
const verboseOutputOption = OFF;

// -d
// default OFF
const randomMLStartingTreeOption = OFF;

// -D
// default OFF
const convergenceCriterionMLOption = OFF;

// -F
// default OFF
const enableCATLargeTreesOption = OFF;

// -H
// default ON
const disablePatternCompressionOption = ON;

// -j
// default OFF
const intermediateTreesToFileOption = OFF;

// -k
// default OFF
const printBranchLengthsBootstrapOption = {
  argument: 'k',
  default: OFF
};

// -M
// default OFF
const estimationPerPartitionBranchLengthsOption = OFF;

// -O
// default OFF
const disableUndeterminedSequenceCheckOption = OFF;

// -u
// default OFF
const medianDiscreteApproximationOption = OFF;

// -V
// default OFF
const disableRateHeterogeneityOption = OFF;

// -X
// default OFF
const computeSuperficialStartingTreeOnlyOption = OFF;

// -y
// default OFF
const computeStartingTreeOnlyOption = OFF;

// --mesquite
// default OFF
const printMesquiteOutputOption = OFF;

// --silent
// default OFF
// TODO not sure if this should be exposed
const disablePrintoutOption = OFF;

// --no-seq-check
// default OFF
const disableSequenceChecksOption = OFF;

// --no-bfgs
// default OFF
const disableBFGSOption = OFF;

// --flag-check
// default OFF
const flagCheckOption = OFF;

// --JC69
// default OFF
const jukesCantorOption = OFF;

// --K80
// default OFF
const kimuraOption = OFF;

/*
    Integer settings
*/

// -b
const randomSeedBootstrapOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256
};

// -c
const distinctRateCatgeoriesOption = {
  min: 0,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: 25
};

// -p
const randomSeedParsimonyOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: Date.now()
};

// -T
const numberThreadsOption = {
  argument: 'T',
  min: 1,
  // TODO does a max and default value make sense?
  defaultValue: 1
  // TODO max value has to be checked dynamically with number of CPUs present
};

// -x
const randomSeedRapidBootstrapOption = {
  min: 1,
  // TODO calc max (FF - FFFFFF)
  max: 256,
  defaultValue: Date.now()
};

// --epa-keep-placements
const epaKeepPlacementsOption = {
  min: 1,
  // TODO what is max
  defaultValue: 7
};

/*
    Double settings
*/

// -B
const bootstopCutoffOption = {
  min: 0,
  max: 1,
  defaultValue: 0.03
};

// -e
const modelOptimizationPrecisionOption = {
  // TODO check min max
  min: 0.0,
  max: 0.1,
  defaultValue: 0.1
};

// TODO not sure if this is a double setting, not specified in help
// -G
const evolutionaryPlacementAlgorithmOption = {
  min: 0.0,
  max: 1.0
};

// --epa-prob-threshold
const epaPropThresholdOption = {
  min: 0.0,
  max: 1.0,
  defaultValue: 0.01
};

/*
    String settings
*/

// -E
const excludeFileNameOption = { defaultValue: '' };

// -g
const multifurcatingConstraintTreeFileNameOption = { defaultValue: '' };

// -n
// Can not be empty per default
const outputFileNameOption = { defaultValue: 'output' };

// -o
const outgroupNameOption = { defaultValue: '' };

// -P
const aminoAcidSubstitutionModelFileNameOption = { defaultValue: '' };

// -q
const multipleModelsFileNameOption = { defaultValue: '' };

// -r
const binaryConstraintTreeFileNameOption = { defaultValue: '' };

// -R
const binaryModelParamFileNameOption = { defaultValue: '' };

// -s
// Can not be empty per default
const alignmentFileNameOption = { defaultValue: 'input' };

// -S
const secondaryStructureFileNameOption = { defaultValue: '' };

// -t
const startingTreeFileNameOption = { defaultValue: '' };

// -Y
const quartetGroupingFileNameOption = { defaultValue: '' };

// -z
const multipleTreeFileNameOption = { defaultValue: '' };

/*
    TODO unclear settings
*/
// -i
// -L
// -U probably boolean but default unclear
// -w String setting, unclear yet how to handle the default that is used when the arg is not given
// -W Integer?
// --epa-accumulated-threshold Integer or Double (unclear to me)

const runSettings = {
  secondaryStructureOptions,
  algorithmOptions,
  bootstoppingOptions,
  consensusTreeOptions,
  kMultistateSubstitutionModelOptions,
  mixedSubstitutionModelOptions,
  binarySubstitutionModelOptions,
  nucleotideSubstitutionModelOptions,
  multistateSubstitutionModelOptions,
  aminoAcidSubstitutionModelOptions,
  aminoAcidSubstitutionMatrixOptions,
  numberRunsOptions,
  numberRepsOptions,
  asscertainmentBiasCorrectionOptions,
  automaticProteinModelSelectionOptions,
  // Booleans
  verboseOutputOption,
  randomMLStartingTreeOption,
  convergenceCriterionMLOption,
  enableCATLargeTreesOption,
  disablePatternCompressionOption,
  intermediateTreesToFileOption,
  printBranchLengthsBootstrapOption,
  estimationPerPartitionBranchLengthsOption,
  disableUndeterminedSequenceCheckOption,
  medianDiscreteApproximationOption,
  disableRateHeterogeneityOption,
  computeSuperficialStartingTreeOnlyOption,
  computeStartingTreeOnlyOption,
  printMesquiteOutputOption,
  disablePrintoutOption,
  disableSequenceChecksOption,
  disableBFGSOption,
  flagCheckOption,
  jukesCantorOption,
  kimuraOption,
  // Integers
  randomSeedBootstrapOption,
  distinctRateCatgeoriesOption,
  randomSeedParsimonyOption,
  numberThreadsOption,
  randomSeedRapidBootstrapOption,
  epaKeepPlacementsOption,
  // Doubles
  bootstopCutoffOption,
  modelOptimizationPrecisionOption,
  evolutionaryPlacementAlgorithmOption,
  epaPropThresholdOption,
  // Strings
  excludeFileNameOption,
  multifurcatingConstraintTreeFileNameOption,
  outputFileNameOption,
  outgroupNameOption,
  aminoAcidSubstitutionModelFileNameOption,
  multipleModelsFileNameOption,
  binaryConstraintTreeFileNameOption,
  binaryModelParamFileNameOption,
  alignmentFileNameOption,
  secondaryStructureFileNameOption,
  startingTreeFileNameOption,
  quartetGroupingFileNameOption,
  multipleTreeFileNameOption
};

export { runSettings };
