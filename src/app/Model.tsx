import React from 'react';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import OptionSelect from './components/OptionSelect';
import OptionCheck from './components/OptionCheck';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { OptionSelectOptionLike } from './components/OptionSelect';
import type { OptionCheckOptionLike } from './components/OptionCheck';

// The run's select options miss OptionSelect's notAvailable or string titles: cast where passed.
interface ModelRun {
  usesModeltestNg: boolean;
  usesAstral: boolean;
  analysis: object;
  numRuns: object;
  numRepetitions: object;
  numRepetitionsNg: object;
  branchLength: OptionCheckOptionLike;
  sHlike: OptionCheckOptionLike;
  combinedOutput: OptionCheckOptionLike;
  startingTree: object;
  outGroup: object;
  haveRandomSeed: boolean;
  randomSeed: number;
  setRandomSeed: ( value: string ) => void;
  substitutionMatrix: object;
  substitutionRate: object;
  substitutionI: object;
  substitutionAscertainment: object;
  multistateModel: object;
  estimatedFrequencies: OptionCheckOptionLike;
  baseFrequencies: object;
}

export interface ModelProps {
  run: ModelRun;
}

const Model = ( { run }: ModelProps ): React.JSX.Element => {
  // TODO: Check marginTop: 2 hack, doesn't seem exactly aligned to top
  if ( run.usesModeltestNg ) {
    return (
      <Box
        sx={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="body1">
          Select the best-fit model of evolution for a single DNA or protein
          alignment
        </Typography>
      </Box>
    );
  }
  if ( run.usesAstral ) {
    return (
      <Box
        sx={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="body1">
          Calculate species tree from a set of gene trees
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        sx={{
          gap: '10px',
        }}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.analysis as OptionSelectOptionLike} />
        <OptionSelect option={run.numRuns as OptionSelectOptionLike} />
        <OptionSelect option={run.numRepetitions as OptionSelectOptionLike} />
        <OptionSelect option={run.numRepetitionsNg as OptionSelectOptionLike} />
        <OptionCheck option={run.branchLength} />
        <OptionCheck option={run.sHlike} />
        <OptionCheck option={run.combinedOutput} />
        <OptionSelect option={run.startingTree as OptionSelectOptionLike} />
      </Box>
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        sx={{
          gap: '10px',
        }}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.outGroup as OptionSelectOptionLike} />
        {run.haveRandomSeed
          ? (
            <TextField
              variant="standard"
              helperText="Seed"
              title="Random seed"
              sx={{ width: 60 }}
              value={run.randomSeed}
              onChange={( e ) => run.setRandomSeed( e.target.value )}
            />
          )
          : null}
      </Box>
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        sx={{
          gap: '10px',
        }}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.substitutionMatrix as OptionSelectOptionLike} />
        <OptionSelect option={run.substitutionRate as OptionSelectOptionLike} />
      </Box>
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        sx={{
          gap: '10px',
        }}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.substitutionI as OptionSelectOptionLike} />
        <OptionSelect option={run.substitutionAscertainment as OptionSelectOptionLike} />
        <OptionSelect option={run.multistateModel as OptionSelectOptionLike} />
        <OptionCheck option={run.estimatedFrequencies} />
        <OptionSelect option={run.baseFrequencies as OptionSelectOptionLike} />
      </Box>
    </Box>
  );
};

export default observer( Model );
