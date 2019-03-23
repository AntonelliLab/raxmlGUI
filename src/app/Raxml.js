import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import IconDelete from '@material-ui/icons/Delete';

import './Raxml.css';

import RgAnalysisSelect from './components/select/RgAnalysisSelect';
import RgRunOptions from './components/RgRunOptions';
import RgOutFileNameInput from './components/input/RgOutFileNameInput';
import RgCpuSelect from './components/select/RgCpuSelect';
import RgStartRunButton from './components/button/RgStartRunButton';
import RgWorkingDirectorySelectButton from './components/button/RgWorkingDirectorySelectButton';

const styles = theme => ({
  formControl: {
    marginRight: '20px'
  },
  button: {
    marginRight: theme.spacing.unit
  },
  textField: {},
  run: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center'
  }
});

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
          <code className="code">
            {run.raxmlBinary} {run.args.join(' ')}
          </code>
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

const ObservableConsole = observer(Console);

class Raxml extends React.Component {
  render() {
    const { classes, run } = this.props;

    return (
      <div className="Raxml">
        <div className="controls">
          <RgAnalysisSelect {...this.props} />
          <RgCpuSelect {...this.props} />
          <RgOutFileNameInput {...this.props} />
          <RgWorkingDirectorySelectButton {...this.props} />

          <FormControl className={classes.formControl}>
            <Button variant="outlined" color="default" onClick={run.removeRun}>
              <IconDelete />
              Remove run
            </Button>
          </FormControl>
        </div>
        <div className={classes.run}>
          <div>
            {!run.running ? (
              <RgStartRunButton {...this.props} />
            ) : (
              <Button
                variant="contained"
                className={classes.button}
                color="secondary"
                onClick={run.cancelRun}
              >
                Cancel
              </Button>
            )}
            {run.stdout ? (
              <Button
                variant="contained"
                className={classes.button}
                color="default"
                onClick={run.clearStdout}
              >
                Clear
              </Button>
            ) : null}
            <Button
              variant="contained"
              className={classes.button}
              color="primary"
              onClick={() => run.showInFolder(run.globalArgs.w)}
            >
              Results Folder
            </Button>
          </div>
        </div>
        <RgRunOptions {...this.props} />
        <ObservableConsole run={run} />
      </div>
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired
};

export default withStyles(styles)(observer(Raxml));
