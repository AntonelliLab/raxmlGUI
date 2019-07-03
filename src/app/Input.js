import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import AlignmentCard from './AlignmentCard';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import OptionSelect from './components/OptionSelect';
import OptionCheck from './components/OptionCheck';
import TreeCard from './TreeCard';

const useStyles = makeStyles(theme => ({
  Input: {
    padding: '10px 5px 10px 10px',
    flexGrow: 1,
    height: '100%',
    maxWidth: '800px',
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
    flexWrap: 'nowrap',
    overflowX: 'scroll',
    borderLeft: `5px solid ${theme.palette.primary.main}`,
    paddingLeft: 10,
  },
  treeList: {
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'scroll',
    borderLeft: `5px solid ${theme.palette.secondary.main}`,
    paddingLeft: 10,
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

  // const SelectNumRuns = run.

  return (
    <div className={classes.Input}>
      <Box component="form" mt={1} mb={2} display="flex" alignItems="center" className={classes.form} noValidate autoComplete="off">
        <OptionSelect option={run.analysis} />
        <TextField
          id="output-name"
          label="Output name"
          className={classes.outputName}
          value={run.outputName}
          onChange={e => run.setOutputName(e.target.value)}
        />
      </Box>
      <Box component="form" mt={1} mb={2} display="flex" alignItems="center" className={classes.form} noValidate autoComplete="off">
        <OptionSelect option={run.numRuns} />
        <OptionSelect option={run.numRepetitions} />
        <OptionCheck option={run.sHlike} />
        <OptionCheck option={run.combinedOutput} />
        <OptionSelect option={run.startingTree} />
        <OptionSelect option={run.outGroup} />
      </Box>

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

      { run.alignments.length === 0 ? null :
        <Button
          variant="contained"
          className={classes.button}
          color="primary"
          onClick={run.proposeRun}
        >
        Check input
        </Button>
      }
    </div>
  );
};


Input.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Input);
