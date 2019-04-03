import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { format } from 'd3-format';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';
import Alignment from './Alignment';

const styles = theme => ({
  Input: {
    padding: '10px',
    flexGrow: 1,
    height: '100%',
  },
  files: {
    marginTop: '10px',
  },
  alignments: {
    marginTop: '10px',
    overflowY: 'auto',
  },
  output: {
    marginTop: '20px',
  },
  fileInfo: {
    fontSize: '0.75em',
    marginTop: '0.25em',
    overflowWrap: 'break-word',
  },
  path: {
    cursor: 'pointer',
    color: theme.palette.secondary.main,
    marginLeft: 4,
  },
  button: {
    margin: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },
  outputButton: {
    marginLeft: theme.spacing.unit,
  }

});

const Input = withStyles(styles)(observer(({ classes, run }) => {
  

  return (
    <div className={classes.Input}>
      <Button variant="contained" color="primary" onClick={run.loadAlignmentFiles}>
        Open files
      </Button>
      { /*
      <Button variant="contained" color="primary" onClick={run.removeAllAlignments}>
        Clear all
      </Button>
      */}
      {/* { FileInfo } */}
      <div className={classes.alignments}>
        { run.alignments.map(alignment => <Alignment key={alignment.path} alignment={alignment} />) }
      </div>
      { run.alignments.length === 0 ? null :
        <Button
          variant="contained"
          className={classes.button}
          color="primary"
          onClick={run.proposeRun}
        >
        { run.alignments.length > 1 ? 'Combine alignments' : 'Analyse alignment' }
        </Button>
      }
    </div>
  );
}));


Input.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Input));
