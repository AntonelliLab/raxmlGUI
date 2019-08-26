import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import OptionSelect from './components/OptionSelect';
import Box from '@material-ui/core/Box';

const styles = theme => ({
  Raxml: {
    padding: '10px',
    width: '100%',
  },
  form: {
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
class Raxml extends React.Component {
  render() {
    const { classes, run } = this.props;

    return (
      <div className={classes.Raxml}>
        <Box component="form" mt={1} mb={2} display="flex" justifyContent="flex-end" className={classes.form} noValidate autoComplete="off">
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
    );
  }
}

Raxml.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired
};

export default withStyles(styles)(Raxml);
