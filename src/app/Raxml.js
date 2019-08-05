import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import OptionSelect from './components/OptionSelect';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarMessage from './components/SnackbarMessage';

import './Raxml.css';

const styles = theme => ({
  raxmlForm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#000',
    // borderBottom: '1px solid #222',
    padding: 10,
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
          <form className={classes.raxmlForm} autoComplete="off">
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
          </form>
        </div>
        <Console run={run} />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          open={!!run.error}
          autoHideDuration={6000}
        >
          <SnackbarMessage
            onClose={run.clearError}
            variant="error"
            message={run.error}
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
