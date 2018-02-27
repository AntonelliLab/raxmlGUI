import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
// import withTheme from './withTheme';
import ipcRenderer from '../app/ipcRenderer';
import Console from './Console';
import cn from 'classnames';
import './App.css';

const styles = theme => ({
  input: {
    borderBottom: `1px solid ${theme.palette.primary.main}`,
  },
});

class App extends React.Component {
  state = {
    filename: '',
  };

  componentDidMount() {
    ipcRenderer.on('open-file', (event, arg) => {
      console.log('Opened file:', arg);
    });
    ipcRenderer.on('filename', (event, arg) => {
      console.log('filename:', arg);
      this.setState({
        filename: arg,
      });
    });
  }

  onClickOpenFile = () => {
    ipcRenderer.send('open-file');
  }

  onClickRun = () => {
    ipcRenderer.send('run');
  }

  render() {
    const { classes } = this.props;

    return (
      <div className="App">
        <div className={cn("input", classes.input)}>
          <Button raised color="primary" onClick={this.onClickOpenFile}>
            Open file
          </Button>
          <div className="files">
            { this.state.filename }
          </div>
        </div>

        <div className="console">
          <Console />
        </div>
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

// export default withTheme(withStyles(styles)(App));
export default withStyles(styles)(App);