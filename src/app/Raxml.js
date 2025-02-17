import React from 'react';
import { clipboard } from 'electron';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { withStyles } from '@mui/styles';
import OptionSelect from './components/OptionSelect';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';

const styles = (theme) => ({
  Raxml: {
    padding: '10px',
    width: '100%',
    flexShrink: 0,
  },
  form: {
    // '& > *:not(:first-child)': {
    '& > *+*': {
      marginLeft: '20px',
    },
  },
  formItem: {
    // marginRight: '20px',
  },
  button: {
    marginRight: theme.spacing(1),
  },
  run: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
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
  },
});

@observer
class Raxml extends React.Component {
  copyCommand = () => {
    const { run, store } = this.props;
    clipboard.writeText(run.command);
    store.setAppSnack();
  };

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
          {run.modelTestIsRunningOnAlignment ? (
            <Button
              size="small"
              variant="outlined"
              onClick={run.cancelModeltestOnAlignment}
            >
              Cancel modeltest
            </Button>
          ) : null}
          {run.running ? (
            <Button size="small" variant="outlined" onClick={run.cancel}>
              Cancel
            </Button>
          ) : null}
          <Button
            variant="contained"
            loading={run.running}
            loadingPosition="end"
            disabled={run.startDisabled}
            onClick={run.start}
          >
            Run
          </Button>
        </Box>

        <Box paddingBottom={1}>
          <Box display="flex">
            <Tooltip aria-label="copy-command" title="Copy command">
              <IconButton
                style={{ position: 'absolute', right: 0 }}
                onClick={this.copyCommand}
                size="large"
              >
                <FileCopyIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body1">{run.command}</Typography>
          </Box>
          <p className="MuiFormHelperText-root">Command</p>
        </Box>
      </div>
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired,
};

export default withStyles(styles)(Raxml);
