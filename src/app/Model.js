import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import OptionSelect from './components/OptionSelect';
import OptionCheck from './components/OptionCheck';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  Model: {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  form: {
    '& > *': {
      marginRight: '10px',
    }
  },
}));

const Model = ({ run }) => {

  const classes = useStyles();

  // TODO: Check marginTop: 2 hack, doesn't seem exactly aligned to top
  if (run.usesModeltestNg) {
    return (
      <div className={classes.Model}>
        <Typography variant="body1">
          Select the best-fit model of evolution for a single DNA or protein alignment
        </Typography>
      </div>
    );
  }
  return (
    <div className={classes.Model}>
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        className={classes.form}
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
        className={classes.form}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.outGroup} />
        {run.haveRandomSeed ? (
          <TextField
            label="Seed"
            title="Random seed"
            style={{ width: 60 }}
            value={run.randomSeed}
            onChange={(e) => run.setRandomSeed(e.target.value)}
          />
        ) : null}
      </Box>
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        alignItems="start"
        className={classes.form}
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
        className={classes.form}
        noValidate
        autoComplete="off"
      >
        <OptionSelect option={run.substitutionI} />
        <OptionSelect option={run.substitutionAscertainment} />
        <OptionSelect option={run.substitutionModel} />
        <OptionSelect option={run.multistateModel} />
        <OptionCheck option={run.estimatedFrequencies} />
        <OptionSelect option={run.baseFrequencies} />
      </Box>
    </div>
  );
};


Model.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Model);
