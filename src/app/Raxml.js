import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import OptionSelect from './components/OptionSelect';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarMessage from './components/SnackbarMessage';
import Box from '@material-ui/core/Box';

import './Raxml.css';

const styles = theme => ({
  raxmlForm: {
    '& > *': {
      marginLeft: '20px'
    }
  },
  formControl: {},
  button: {
    marginRight: theme.spacing(1)
  },
  run: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center'
  }
});

@observer
class Console extends React.Component {
  keepToBottom = true;

  onMountStdoutContainer = el => {
    this.stdoutContainer = el;
  };

  componentDidUpdate() {
    if (this.keepToBottom) {
      this.scrollConsoleToBottom();
    }
  }

  isAtBottom = () => {
    const { scrollTop, scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    const scrollIsAtBottom = scrollTop === diff;
    return scrollIsAtBottom;
  };

  scrollConsoleToBottom = () => {
    const { scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    this.stdoutContainer.scrollTop = diff;
  };

  render() {
    const { run } = this.props;
    return (
      <div
        className="Console stdoutContainer"
        ref={this.onMountStdoutContainer}
      >
        <div>
          <code className="code">{run.command}</code>
        </div>
        <div>
          <code className="code">{run.stdout}</code>
        </div>
      </div>
    );
  }
}

Console.propTypes = {
  run: PropTypes.object.isRequired
};

@observer
class Raxml extends React.Component {
  render() {
    const { classes, run } = this.props;

    return (
      <div className="Raxml">
        <div>
          <Box component="form" p={1} display="flex" justifyContent="flex-end" alignItems="flex-end" className={classes.raxmlForm} noValidate autoComplete="off">
            {run.stdout === '' ? null : (
              <Button variant="outlined" onClick={run.clearStdout}>
                Clear
              </Button>
            )}
            {run.running ? (
              <Button variant="outlined" color="primary" onClick={run.cancel}>
                Cancel
              </Button>
            ) : null}
            <OptionSelect option={run.numThreads} />
            <Button
              variant="contained"
              disabled={run.startDisabled}
              onClick={run.start}
            >
              Run
            </Button>
          </Box>
        </div>
        <Console run={run} />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          open={!!run.error}
          autoHideDuration={6000}
          onClose={run.clearError}
        >
          <SnackbarMessage
            onClose={run.clearError}
            variant="error"
            message={run.error}
          />
        </Snackbar>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          open={run.finished}
          autoHideDuration={6000}
          onClose={run.clearFinished}
        >
          <SnackbarMessage
            onClose={run.clearFinished}
            variant="success"
            message="RAxML finished!"
          />
        </Snackbar>
      </div>
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired
};

export default withStyles(styles)(Raxml);
