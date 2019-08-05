import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(theme => ({
  Output: {
    width: '100%',
  },
  form: {
    width: '100%',
    '& > *:not(:first-child)': {
      marginTop: theme.spacing(3),
    }
  },
  formItem: {
  },
}));

const Output = ({ run }) => {

  const classes = useStyles();

  // const SelectNumRuns = run.

  return (
    <div className={classes.Output}>
      <Box component="form" mt={1} mb={2} display="flex" flexDirection="column" className={classes.form} noValidate autoComplete="off">
        <TextField
          id="output-name"
          label="Output name"
          className={classes.formItem}
          value={run.outputName}
          placeholder={run.outputNamePlaceholder}
          onChange={e => run.setOutputName(e.target.value)}
          error={!run.outputNameOk}
          helperText={run.outputNameNotice}
        />
        <TextField
          id="output-dir"
          label="Output dir"
          fullWidth
          className={classes.formItem}
          value={run.outputDir}
          onClick={run.selectOutputDir}
        />
        <Button onClick={run.openOutputDir} variant="outlined">Open folder</Button>
      </Box>

    </div>
  );
};


Output.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Output);
