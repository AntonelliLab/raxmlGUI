import React from 'react';
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import { LinearProgress } from 'material-ui/Progress';
import Fade from 'material-ui/transitions/Fade';
import { withStyles } from 'material-ui/styles';
import cn from 'classnames';
import ipcRenderer from '../app/ipcRenderer';
import './Console.css';


const styles = theme => ({
  run: {
    // borderBottom: `1px solid ${theme.palette.secondary.main}`,
  }
});

class Console extends React.Component {
  state = {
    open: true,
    stdout: '',
    isRunning: false,
    haveFile: false,
  };

  componentDidMount() {
    ipcRenderer.on('open-file', (event, arg) => {
      console.log('Opened file:', arg);
    });
    ipcRenderer.on('raxml-output', (event, buffer) => {
      console.log('Raxml output:', String(buffer));
      this.printToConsole(String(buffer));
    });
    ipcRenderer.on('raxml-close', (event, code) => {
      console.log('Raxml close:', code);
      this.setState({
        isRunning: false,
      });
    });
    ipcRenderer.on('filename', (event, filename) => {
      this.setState({
        haveFile: !!filename,
        stdout: '',
      });
    });
  }

  onMountInput = (el) => {
    this.consoleInput = el;
  }

  onMountStdoutContainer = (el) => {
    this.stdoutContainer = el;
  }

  onClickRun = () => {
    this.setState({
      isRunning: true,
    });
    ipcRenderer.send('run');
  }

  onClickCancel = () => {
    this.setState({
      isRunning: false,
    });
    ipcRenderer.send('cancel');
  }

  printToConsole = (content) => {
    if (!this.stdoutContainer) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    const scrollIsAtBottom = scrollTop === diff;
    this.setState({
      stdout: this.state.stdout + content,
    }, () => {
      if (scrollIsAtBottom) {
        this.scrollConsoleToBottom();
      }
    });
  }
  
  scrollConsoleToBottom = () => {
    const { scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    this.stdoutContainer.scrollTop = diff;
  }

  render() {
    const { classes } = this.props;
    const { isRunning, haveFile } = this.state;

    return (
      <div className="Console">
        <div className={cn("run", classes.run)}>
        { !isRunning ? (
          <Button className="button" raised
            disabled={!haveFile}
            color='accent'
            onClick={this.onClickRun}
          >
            Run
          </Button>
        ) : (
          <Button className="button" raised
            color='secondary'
            onClick={this.onClickCancel}
          >
            Cancel
          </Button>
        )}
        </div>
        <Fade
          in={isRunning}
          unmountOnExit
        >
          <div className="relative" style={{ width: '100%' }}>
            <div className="absolute" style={{ left: 0, right: 0 }}>
              <LinearProgress className="absolute" />
            </div>
          </div>
        </Fade>
        <div className="stdoutContainer" ref={this.onMountStdoutContainer}>
          <pre className="stdout">
            {this.state.stdout}
          </pre>
        </div>
      </div>
    );
  }
}

Console.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Console);