import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import OptionSelect from './components/OptionSelect';
import OptionCheck from './components/OptionCheck';
import IconButton from '@material-ui/core/IconButton';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { FormControl, FormHelperText } from '@material-ui/core';

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
  return (
    <div className={classes.Model}>
      <Box component="form" mt={1} mb={2} display="flex" alignItems="start" className={classes.form} noValidate autoComplete="off">
        <OptionSelect option={run.analysis} />
        <OptionSelect option={run.numRuns} />
        <OptionSelect option={run.numRepetitions} />
        <OptionSelect option={run.numRepetitionsNg} />
        <OptionCheck option={run.branchLength} />
        <OptionCheck option={run.sHlike} />
        <OptionCheck option={run.combinedOutput} />
        <OptionSelect option={run.startingTree} />
        <OptionSelect option={run.outGroup} />
        { run.haveRandomSeed ? (
          <FormControl title="Randomize seed">
            <FormHelperText style={{ marginTop: 2 }}>Randomize</FormHelperText>
            <FormControlLabel
              control={
                <IconButton label="Randomize seed" color="default" onClick={run.randomizeSeed}>
                  <ShuffleIcon />
                </IconButton>
              }
              label=""
            />
          </FormControl>
        ) : null}
      </Box>
      <Box component="form" mt={1} mb={2} display="flex" alignItems="center" className={classes.form} noValidate autoComplete="off">
        <OptionSelect option={run.substitutionModel} />
        <OptionSelect option={run.multistateModel} />
      </Box>

    </div>
  );
};


Model.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Model);
