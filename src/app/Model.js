import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import OptionSelect from './components/OptionSelect';
import OptionCheck from './components/OptionCheck';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const Model = ({ run }) => {

  // TODO: Check marginTop: 2 hack, doesn't seem exactly aligned to top
  if (run.usesModeltestNg) {
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
  if (run.usesAstral) {
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
        <OptionSelect option={run.analysis} />
        <OptionSelect option={run.numRuns} />
        <OptionSelect option={run.numRepetitions} />
        <OptionSelect option={run.numRepetitionsNg} />
        <OptionCheck option={run.branchLength} />
        <OptionCheck option={run.sHlike} />
        <OptionCheck option={run.combinedOutput} />
        <OptionSelect option={run.startingTree} />
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
        <OptionSelect option={run.outGroup} />
        {run.haveRandomSeed ? (
          <TextField
            variant="standard"
            helperText="Seed"
            title="Random seed"
            sx={{ width: 60 }}
            value={run.randomSeed}
            onChange={(e) => run.setRandomSeed(e.target.value)} />
        ) : null}
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
        <OptionSelect option={run.substitutionMatrix} />
        <OptionSelect option={run.substitutionRate} />
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
        <OptionSelect option={run.substitutionI} />
        <OptionSelect option={run.substitutionAscertainment} />
        <OptionSelect option={run.multistateModel} />
        <OptionCheck option={run.estimatedFrequencies} />
        <OptionSelect option={run.baseFrequencies} />
      </Box>
    </Box>
  );
};


Model.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Model);
