import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddBox';
import { format } from 'd3-format';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';
import Alignment from './Alignment';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';

const useStyles = makeStyles(theme => ({
  Input: {
    padding: '10px',
    flexGrow: 1,
    height: '100%',
  },
  files: {
    marginTop: '10px',
  },
  alignmentList: {
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'scroll',
  },
  alignments: {
    display: 'flex',
  },
  addAlignment: {
    width: '200px',
    height: '200px',
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
    margin: theme.spacing(1),
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
  outputButton: {
    marginLeft: theme.spacing(1),
  },
  gridList: {
    flexWrap: 'nowrap',
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: 'translateZ(0)',
    width: 500,
  },

}));

const Input = ({ run }) => {

  const classes = useStyles();

  return (
    <div className={classes.Input}>

      <div className={classes.alignmentList}>
        <div className={classes.alignments}>
        { run.alignments.map(alignment => (
          <Alignment key={alignment.path} alignment={alignment} className="alignment" />
        )) }
        <Button variant="outlined" className={`alignment ${classes.addAlignment}`} onClick={run.loadAlignmentFiles}>
          Add alignment
        </Button>
        </div>
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
};


Input.propTypes = {
  classes: PropTypes.object.isRequired,
  run: PropTypes.object.isRequired,
};

export default observer(Input);
