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
import { modelTypeNames } from './store';
import './Raxml.css';


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
    const { model } = this.props;
    return (
      <div className="Console stdoutContainer" ref={this.onMountStdoutContainer}>
        <div>
          <code className="code">
            {model.raxmlBinary} { model.args.join(' ') }
          </code>
        </div>
        <div>
          <code className="code">
          { model.stdout }
          </code>
        </div>
      </div>
    )
  }
}

Console.propTypes = {
  model: PropTypes.object.isRequired,
}

const ObservableConsole = observer(Console)

class Raxml extends React.Component {

  render() {
    const { classes, model } = this.props;

    const MenuItemsModel = modelTypeNames.map((name, index) => (
      <MenuItem key={index} value={index}>{name}</MenuItem>
    ));
    
    return (
      <div className="Raxml">
        <div className="controls">
          <FormControl className={classes.formControl}>
            <Select
              value={model.type}
              onChange={(_, item) => model.setType(item.props.value)}
              name="model"
            >
              { MenuItemsModel }
            </Select>
            <FormHelperText>Model</FormHelperText>
          </FormControl>
          <FormControl className={classes.formControl}>
            <Select
              value={model.numCpu}
              onChange={(_, item) => model.setNumCpu(item.props.value)}
              name="Number of cpus"
              >
              { model.cpuOptions.map(value => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              )) }
            </Select>
            <FormHelperText>Number of cpus</FormHelperText>
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              className={classes.textField}
              onChange={(e) => model.setOutName(e.target.value)}
              id="outName"
              value={model.outName}
              placeholder={model.outNamePlaceholder}
              helperText="Output suffix"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <Button variant="outlined" color="default" onClick={model.delete}>
              <IconDelete />
              Remove model
            </Button>
          </FormControl>
        </div>
        <div className={classes.run}>
          <div>
          
            { !model.running ? (
              <Button variant="contained" className={classes.button}
                disabled={model.disabled}
                color='primary'
                onClick={model.run}
              >
                Run
              </Button>
            ) : (
              <Button variant="contained" className={classes.button}
                color='secondary'
                onClick={model.cancel}
              >
                Cancel
              </Button>
            )}
            { model.stdout ? (
              <Button variant="contained" className={classes.button}
                color='default'
                onClick={model.clearStdout}
              >
                Clear
              </Button>
            ) : null }
          </div>
        </div>
        <ObservableConsole model={model} />
      </div>
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  model: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Raxml));