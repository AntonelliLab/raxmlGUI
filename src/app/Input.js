import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import AlignmentCard, { FinalAlignmentCard } from './AlignmentCard';
import Box from '@material-ui/core/Box';
import TreeCard from './TreeCard';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  Input: {
  },
  form: {
    '& > *': {
      marginRight: '10px',
    }
  },
  files: {
    marginTop: '10px',
  },
  alignmentList: {
    display: 'flex',
    // width: '100%',
    flexWrap: 'nowrap',
    overflowX: 'scroll',
    // borderLeft: `5px solid ${theme.palette.primary.main}`,
    // paddingLeft: 10,
  },
  treeList: {
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'scroll',
    // borderLeft: `5px solid ${theme.palette.secondary.main}`,
    // paddingLeft: 10,
  },
  alignments: {
    display: 'flex',
  },
  addAlignment: {
    width: '200px',
    height: '200px',
  },
  treeCard: {
    width: '350px',
    height: '100px',
  },
  finalInput: {
  },
  concatenatedAlignment: {
    width: '350px',
    height: '150px',
  },
  resultingPartitionCard: {
    width: '350px',
    height: '150px',
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
  outputDir: {
    // flex: 'flex-grow',
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

  // const SelectNumRuns = run.

  return (
    <div className={classes.Input}>
      <Box mb={1} className={classes.alignmentList}>
        <div className={classes.alignments}>
        { run.alignments.map(alignment => (
          <AlignmentCard key={alignment.path} alignment={alignment} className="alignment" />
        )) }
        <Button variant="outlined" className={`alignment ${classes.addAlignment}`} onClick={run.loadAlignmentFiles}>
          Add alignment
        </Button>
        </div>
      </Box>

      { run.tree.notAvailable ? null :
        <Box className={classes.treeList}>
          <div className={classes.alignments}>
          { run.tree.haveFile ?
            <TreeCard tree={run.tree} className={classes.treeCard} /> :
            <Button variant="outlined" className={classes.treeCard} onClick={run.loadTreeFile}>
              Add Tree
            </Button>
          }
          </div>
        </Box>
      }

      { run.alignments.length <= 1 ? null :
        <Box className={classes.finalInput}>
          <Typography variant="h5">Concatenated alignment</Typography>
          <FinalAlignmentCard alignment={run.finalAlignment} className={classes.concatenatedAlignment} />
        </Box>
      }

    </div>
  );
};
// <Box mt={1} display="flex">
// { run.ok ? null : run.missing }
// </Box>


Input.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Input);
