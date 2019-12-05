import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
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
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Partition from './Partition';
import OptionSelect from './components/OptionSelect';
import OptionTextField from './components/OptionTextField';

const InputSwitch = withStyles(theme => ({
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

const useStyles = makeStyles(theme => ({
  AlignmentCard: {
    backgroundColor: theme.palette.input.main,
    border: `1px solid ${theme.palette.input.light}`
  },
  heading: {
    display: 'flex',
    alignItems: 'center'
  },
  content: {
    display: 'flex',
    alignItems: 'center'
  },
  name: {
    marginRight: theme.spacing(1)
  },
  chip: {
    height: '30px',
    backgroundColor: theme.palette.input.dark,
    border: `1px solid ${theme.palette.input.light}`,
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.secondary.main
  },
  secondaryText: {
    color: theme.palette.input.secondaryText,
  },
  divider: {
    margin: '0 4px'
  },
  fileInfo: {
    color: '#ccc',
    fontSize: '0.75em',
    marginTop: '0.25em',
    overflowWrap: 'break-word'
  },
  partitionFileContainer: {
    overflowY: 'auto',
    height: 50
  },
  partitionFileContent: {
    color: 'white',
    fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontSize: '10px',
    height: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap'
  },
  path: {
    cursor: 'pointer',
    color: theme.palette.secondary.main,
    marginLeft: 4
  },
  button: {
    margin: theme.spacing(1)
  },
  rightIcon: {
    marginLeft: theme.spacing(1)
  },
  iconSmall: {
    fontSize: 20
  },
  outputButton: {
    marginLeft: theme.spacing(1)
  },
  loading: {
    marginLeft: '10px'
  },
  remove: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  }
}));

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
    <span className={classes.secondaryText}>Parsing... {alignment.numSequencesParsed} </span>
  );

  // const Type = alignment.typecheckingComplete ? (
  //   <span>{ dataType }</span>
  // ) : (
  //   <span>{ alignment.parsingComplete ? 'Checking...' : 'Pending...' }</span>
  // );

  const Type = dataType ? (
    <Chip
      classes={{ colorSecondary: classes.chip }}
      label={dataType}
      color="secondary"
    />
  ) : (
    <CircularProgress variant="indeterminate" size={20} />
  );

  // const Check = alignment.checkRunComplete ? (
  //   <span>{ alignment.checkRunSuccess ? 'ok' : 'failed' }</span>
  // ) : (
  //   <span>{ alignment.typecheckingComplete ? 'Checking...' : 'Pending...' }</span>
  // );

  const Content = alignment.showPartition ? (
    <Partition alignment={alignment} />
  ) : (
    <div className={classes.content}>
      <div>
        {alignment.run.usesRaxmlNg ? (
          <OptionSelect option={alignment.substitutionModel} />
        ) : null}
        {alignment.run.usesRaxmlNg ? (
          <OptionTextField option={alignment.multistateNumber} />
        ) : null}
        {alignment.modelExtra ? (
          <FormControl>
            <InputLabel className={classes.secondaryText} style={{ whiteSpace: 'nowrap' }} htmlFor={alignment.modelExtra.label}>{alignment.modelExtra.label}</InputLabel>
            <Select
              value={alignment.modelExtra.value}
              onChange={alignment.modelExtra.onChange}
              inputProps={{
                name: alignment.modelExtra.label,
                id: alignment.modelExtra.label,
              }}
            >
              {alignment.modelExtra.options.map(model => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </div>
    </div>
  );
  // <div className={classes.remove}>
  //   <Button variant="outlined" color="default" onClick={alignment.remove}>
  //     <IconDelete />
  //   </Button>
  // </div>

  // <MenuItem onClick={closeMenuAndRun(alignment.setShowPartition)}>Show partition</MenuItem>

  return (
    <Card className={classNames(className, classes.AlignmentCard)} raised>
      <CardHeader
        avatar={Type}
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
              <MenuItem onClick={closeMenuAndRun(alignment.showFileInFolder)}>
                Show in folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.remove)}>
                Remove alignment
              </MenuItem>
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
      {alignment.numSequences} sequences of length {alignment.length}
    </span>
  ) : (
    <span className={classes.secondaryText}>Parsing... {alignment.numSequencesParsed} </span>
  );

  return (
    <Card className={classNames(className, classes.AlignmentCard)} raised>
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
              onChange={event => {
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
            {alignment.partitionFileContent}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>

AlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string
};

FinalAlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string
};

const AlignmentCardObserver = observer(AlignmentCard);
const FinalAlignmentCardObserver = observer(FinalAlignmentCard);

export default AlignmentCardObserver;
export { FinalAlignmentCardObserver as FinalAlignmentCard };
