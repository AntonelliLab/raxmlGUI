import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import OptionSelect from './components/OptionSelect';
import Box from '@material-ui/core/Box';
import LoadingButton from './components/LoadingButton';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  Raxml: {
    padding: '10px',
    width: '100%',
    flexShrink: 0,
  },
  form: {
    // '& > *:not(:first-child)': {
    '& > *+*': {
      marginLeft: '20px'
    }
  },
  formItem: {
    // marginRight: '20px',
  },
  button: {
    marginRight: theme.spacing(1)
  },
  run: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center'
  },
  code: {
    color: theme.palette.console.contrastText,
    fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontSize: '12px',
    height: '100%',
    width: '100%',
    // overflowWrap: 'anywhere', // currently not available in Chrome
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }
});

@observer
class Raxml extends React.Component {
  render() {
    const { classes, run } = this.props;

    return (
      <div className={classes.Raxml}>
        <Box
          component="form"
          mt={1}
          mb={2}
          display="flex"
          className={classes.form}
          noValidate
          autoComplete="off"
          alignItems="center"
        >
          <OptionSelect className={classes.formItem} option={run.binary} />
          <OptionSelect className={classes.formItem} option={run.numThreads} />
          <div style={{ flexGrow: 1 }} />
          {run.modelTestIsRunningOnAlignment ? (
            <Button
              size="small"
              variant="outlined"
              color="default"
              onClick={run.cancelModeltestOnAlignment}
            >
              Cancel modeltest
            </Button>
          ) : null}
          {run.running ? (
            <Button
              size="small"
              variant="outlined"
              color="default"
              onClick={run.cancel}
            >
              Cancel
            </Button>
          ) : null}
          <LoadingButton
            variant="contained"
            color="default"
            classes={{
              root: classes.primaryButton,
            }}
            loading={run.running}
            disabled={run.startDisabled}
            onClick={run.start}
          >
            Run
          </LoadingButton>
        </Box>

        <Box paddingBottom={1}>
          <TextField
            helperText="Command"
            fullWidth
            multiline
            variant="standard"
            value={run.command}
          />
        </Box>
      </div>
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired
};

export default withStyles(styles)(Raxml);
