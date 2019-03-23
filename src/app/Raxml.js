import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import IconDelete from '@material-ui/icons/Delete';
import TextField from '@material-ui/core/TextField';
import { runTypeNames } from './store';
import './Raxml.css';

import RgAnalysisSelect from './components/select/RgAnalysisSelect';
import RgRunOptions from './components/RgRunOptions';
import RgOutFileNameInput from './components/input/RgOutFileNameInput';

const styles = theme => ({
  formControl: {
    marginRight: '20px',
  },
  button: {
    marginRight: theme.spacing.unit,
  },
  textField: {
  },
  run: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
  },
});

class Console extends React.Component {

  keepToBottom = true;

  onMountStdoutContainer = (el) => {
    this.stdoutContainer = el;
  }

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
  }
  
  scrollConsoleToBottom = () => {
    const { scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    this.stdoutContainer.scrollTop = diff;
  }

  render() {
    const { run } = this.props;
    return (
      <div className="Console stdoutContainer" ref={this.onMountStdoutContainer}>
        <div>
          <code className="code">
            {run.raxmlBinary} { run.args.join(' ') }
          </code>
        </div>
        <div>
          <code className="code">
          { run.stdout }
          </code>
        </div>
      </div>
    )
  }
}

Console.propTypes = {
  run: PropTypes.object.isRequired,
}

const ObservableConsole = observer(Console)

class Raxml extends React.Component {
  render() {
    const { classes, run } = this.props;

    return (
      <div className="Raxml">
        <div className="controls">
          <RgAnalysisSelect {...this.props} />
          <RgCpuSelect {...this.props} />
          <RgOutFileNameInput {...this.props} />

          <FormControl className={classes.formControl}>
            <Button variant="outlined" color="default" onClick={run.delete}>
              <IconDelete />
              Remove run
            </Button>
          </FormControl>
        </div>
        <div className={classes.run}>
          <div>
          
            { !run.running ? (
              <Button variant="contained" className={classes.button}
                disabled={run.disabled}
                color='primary'
                onClick={run.run}
              >
                Run
              </Button>
            ) : (
              <Button variant="contained" className={classes.button}
                color='secondary'
                onClick={run.cancel}
              >
                Cancel
              </Button>
            )}
            { run.stdout ? (
              <Button variant="contained" className={classes.button}
                color='default'
                onClick={run.clearStdout}
              >
                Clear
              </Button>
            ) : null }
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
  run: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Raxml));