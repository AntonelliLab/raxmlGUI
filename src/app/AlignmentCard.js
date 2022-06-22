import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import classNames from 'classnames';
import CircularProgress from '@material-ui/core/CircularProgress';
import Chip from '@material-ui/core/Chip';
import Switch from '@material-ui/core/Switch';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import OptionSelect from './components/OptionSelect';
import OptionTextField from './components/OptionTextField';
import CardActions from '@material-ui/core/CardActions';
import LoadingButton from './components/LoadingButton';
import Box from '@material-ui/core/Box';

const InputSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.input.secondaryText,
    '&$checked': {
      color: theme.palette.input.dark,
    },
    '&$checked + $track': {
      backgroundColor: theme.palette.input.dark,
    },
  },
  checked: {},
  track: {},
}))(Switch);

// const useStyles = makeStyles(theme => ({
const useStyles = makeStyles((theme) => {
  return {
    AlignmentCard: {
      backgroundColor: theme.palette.input.light,
      border: `1px solid ${theme.palette.input.border}`,
    },
    cardHeaderRoot: {
      overflow: "hidden"
    },
    cardHeaderContent: {
      overflow: "hidden"
    },
    heading: {
      display: 'flex',
      alignItems: 'center',
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '-10px',
    },
    name: {
      marginRight: theme.spacing(1),
    },
    chip: {
      height: '30px',
      color: theme.palette.input.contrastText,
      backgroundColor: theme.palette.input.main,
      border: `1px solid ${theme.palette.input.darker}`,
    },
    link: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
    },
    secondaryText: {
      color: theme.palette.primary.secondaryText,
    },
    divider: {
      margin: '0 4px',
    },
    fileInfo: {
      color: '#ccc',
      fontSize: '0.75em',
      marginTop: '0.25em',
      overflowWrap: 'break-word',
    },
    partitionFileContainer: {
      overflowY: 'auto',
      height: 50,
    },
    partitionFileContent: {
      color: theme.palette.primary.contrastText,
      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontSize: '10px',
      height: '100%',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    path: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
      marginLeft: 4,
    },
    button: {
      margin: theme.spacing(1),
    },
    primaryButton: {
      backgroundColor: theme.palette.input.main,
      border: `1px solid ${theme.palette.input.darker}`,
      color: theme.palette.input.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.input.main,
      },
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
    loading: {
      marginLeft: '10px',
    },
    remove: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'flex-end',
    },
    select: {
      marginLeft: '10px',
      minWidth: '150px',
    },
    selectWide: {
      marginLeft: '10px',
      minWidth: '200px',
    },
  };
});

function _ModelTestButton({ alignment }) {
  const classes = useStyles();
  if (!alignment.modelTestCanRun) {
    return null;
  }
  return (
    <LoadingButton
      variant="contained"
      color="default"
      style={{ marginLeft: 10 }}
      classes={{
        root: classes.primaryButton,
      }}
      loading={alignment.modeltestLoading}
      onClick={alignment.runModelTest}
      disabled={alignment.modeltestDisabled}
    >
      Run ModelTest
    </LoadingButton>
  );
}
_ModelTestButton.propTypes = {
  alignment: PropTypes.object.isRequired,
};

const ModelTestButton = observer(_ModelTestButton);

function AlignmentCard({ className, alignment }) {
  const { dataType, numSequences, length } = alignment;

  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleMenuClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function closeMenuAndRun(callback) {
    return () => {
      callback();
      setAnchorEl(null);
    };
  }

  const Size = alignment.parsingComplete ? (
    <span className={classes.secondaryText}>
      {numSequences} sequences of length {length}
    </span>
  ) : (
    <span className={classes.secondaryText}>
      Parsing... {alignment.numSequencesParsed}{' '}
    </span>
  );

  // const Type = alignment.typecheckingComplete ? (
  //   <span>{ dataType }</span>
  // ) : (
  //   <span>{ alignment.parsingComplete ? 'Checking...' : 'Pending...' }</span>
  // );

  const Type = dataType ? (
    <Chip classes={{ root: classes.chip }} label={dataType} />
  ) : (
    <CircularProgress variant="indeterminate" size={20} />
  );

  // const Check = alignment.checkRunComplete ? (
  //   <span>{ alignment.checkRunSuccess ? 'ok' : 'failed' }</span>
  // ) : (
  //   <span>{ alignment.typecheckingComplete ? 'Checking...' : 'Pending...' }</span>
  // );

  const Content = (
    <div className={classes.content}>
      <div>
        {alignment.run.usesRaxmlNg ? (
          <Box display="flex">
            <Box display="flex" flexWrap="wrap" alignItems="center">
              <OptionSelect
                className={classes.select}
                option={alignment.substitutionModel}
              />
              <OptionTextField
                className={classes.select}
                option={alignment.multistateNumber}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngStationaryFrequencies}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngInvariantSites}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngRateHeterogeneity}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngAscertainmentBias}
              />
              <ModelTestButton alignment={alignment} />
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" alignItems="center">
            {alignment.modelExtra ? (
              <OptionSelect
                className={classes.select}
                option={{
                  ...alignment.modelExtra,
                  setValue: alignment.modelExtra.onChange,
                  title: alignment.modelExtra.label,
                  options: alignment.modelExtra.options.map((model) => (
                    {
                      value: model,
                      title: model,
                    }
                  )),
                }}
              />
            ) : null}
            <ModelTestButton alignment={alignment} />
          </Box>
        )}
      </div>
    </div>
  );
  // <div className={classes.remove}>
  //   <Button variant="outlined" color="default" onClick={alignment.remove}>
  //     <IconDelete />
  //   </Button>
  // </div>

  return (
    <Card className={classNames(className, classes.AlignmentCard)}>
      <CardHeader
        classes={{
          root: classes.cardHeaderRoot,
          content: classes.cardHeaderContent,
        }}
        avatar={Type}
        action={
          <div>
            <Tooltip
              aria-label="remove-alignment"
              title="Remove alignment"
            >
              <IconButton onClick={alignment.remove}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>

            <IconButton
              aria-owns={anchorEl ? 'alignment-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="alignment-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>
                Open aligment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.showFileInFolder)}>
                Show in folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.remove)}>
                Remove alignment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.setShowPartition)}>
                Edit partition
              </MenuItem>
              {alignment.modeltestLoading ? (
                <MenuItem onClick={closeMenuAndRun(alignment.cancelModelTest)}>
                  Cancel modeltest
                </MenuItem>
              ) : null}
            </Menu>
          </div>
        }
        title={alignment.filename}
        subheader={Size}
      />
      <div>
        {alignment.loading ? (
          <div className={classes.loading}>
            <CircularProgress variant="indeterminate" />
          </div>
        ) : null}
      </div>
      <CardContent>{Content}</CardContent>
      <CardActions>
        {alignment.partition.isComplete || alignment.showPartition ? null : (
          <Typography variant="caption" color="primary">
            Partition not complete, click{' '}
            <strong
              style={{ cursor: 'pointer' }}
              onClick={alignment.setShowPartition}
            >
              here
            </strong>{' '}
            to edit.
          </Typography>
        )}
      </CardActions>
    </Card>
  );
}

function FinalAlignmentCard({ className, alignment }) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleMenuClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function closeMenuAndRun(callback) {
    return () => {
      callback();
      setAnchorEl(null);
    };
  }

  const Size = alignment.parsingComplete ? (
    <span className={classes.secondaryText}>
      {alignment.numSequences} sequences of length {alignment.length} from{' '}
      {alignment.numAlignments} alignment
      {alignment.numAlignments > 1 ? 's' : ''}
    </span>
  ) : (
    <span className={classes.secondaryText}>
      Parsing... {alignment.numSequencesParsed}{' '}
    </span>
  );

  return (
    <Card className={classNames(className, classes.AlignmentCard)}>
      <CardHeader
        avatar={
          <Chip
            className={classes.chip}
            label={alignment.dataType}
            color="secondary"
          />
        }
        action={
          <div>
            <IconButton
              aria-owns={anchorEl ? 'alignment-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="alignment-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>
                Open aligment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openPartition)}>
                Open partition
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openFolder)}>
                Open folder
              </MenuItem>
            </Menu>
          </div>
        }
        title={alignment.filename}
        subheader={Size}
        style={{ paddingBottom: 4 }}
      />
      <CardContent style={{ paddingTop: 0 }}>
        <FormControlLabel
          title="Use union (on) or intersection (off) of taxons from all alignments"
          control={
            <InputSwitch
              checked={alignment.fillTaxonGapsWithEmptySeqeunces}
              onChange={(event) => {
                alignment.setFillTaxonGapsWithEmptySeqeunces(
                  event.target.checked
                );
              }}
              value="fillTaxonGapsWithEmptySeqeunces"
            />
          }
          label={
            <Typography variant="body2">
              Fill taxon gaps with empty sequences
            </Typography>
          }
        />
        <div className={classes.partitionFileContainer}>
          <code className={classes.partitionFileContent}>
            {alignment.partition.text}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>

AlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

FinalAlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

const AlignmentCardObserver = observer(AlignmentCard);
const FinalAlignmentCardObserver = observer(FinalAlignmentCard);

export default AlignmentCardObserver;
export { FinalAlignmentCardObserver as FinalAlignmentCard };
