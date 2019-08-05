import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import CircularProgress from "@material-ui/core/CircularProgress";
import Chip from "@material-ui/core/Chip";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormHelperText from '@material-ui/core/FormHelperText';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Partition from './Partition';

const useStyles = makeStyles(theme => ({
  AlignmentCard: {
    // backgroundColor: theme.palette.secondary.main,
    border: `1px solid #999`
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    marginRight: theme.spacing(1),
  },
  chip: {
    height: '30px',
    backgroundColor: theme.palette.input.main,
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.secondary.main,
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
    color: 'white',
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
    }
  }

  const Size = alignment.parsingComplete ? (
    <span>{ numSequences } sequences of length { length }</span>
  ) : (
    <span>Parsing... { alignment.numSequencesParsed } </span>
  );

  // const Type = alignment.typecheckingComplete ? (
  //   <span>{ dataType }</span>
  // ) : (
  //   <span>{ alignment.parsingComplete ? 'Checking...' : 'Pending...' }</span>
  // );

  const Type = alignment.typecheckingComplete ? (
    <Chip classes={{ colorSecondary: classes.chip }} label={dataType} color="secondary" />
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
        <FormControl>
          <Select value={alignment.model} onChange={alignment.onChangeModel}>
            {
              (alignment.modelOptions || []).map(model => (
                <MenuItem key={model} value={model}>
                  { model }
                </MenuItem>
              ))
            }
          </Select>
          <FormHelperText>Substitution model</FormHelperText>
        </FormControl>
        { alignment.modelExtra ? (
          <FormControl>
          <Select value={alignment.modelExtra.value} onChange={alignment.modelExtra.onChange}>
            {
              alignment.modelExtra.options.map(model => (
                <MenuItem key={model} value={model}>
                  { model }
                </MenuItem>
              ))
            }
          </Select>
          <FormHelperText>{alignment.modelExtra.label}</FormHelperText>
        </FormControl>
        ) : null }
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
        avatar={
          Type
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

            <Menu id="alignment-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>Open aligment</MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.showFileInFolder)}>Show in folder</MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.remove)}>Remove alignment</MenuItem>
            </Menu>
          </div>
        }
        title={ alignment.filename }
        subheader={ Size }
      />
      <div>
        { alignment.loading ? (
          <div className={classes.loading}>
            <CircularProgress variant="indeterminate" />
          </div>
        ) : null }
      </div>
      <CardContent>
      { Content }
      </CardContent>
    </Card>
  );
};


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
    }
  }

  const Size = alignment.parsingComplete ? (
    <span>{ alignment.numSequences } sequences of length { alignment.length }</span>
  ) : (
    <span>Parsing... { alignment.numSequencesParsed } </span>
  );

  return (
    <Card className={classNames(className, classes.AlignmentCard)} raised>
      <CardHeader
        avatar={
          <Chip className={classes.chip} label={alignment.dataType} color="secondary" />
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

            <Menu id="alignment-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>Open aligment</MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openFolder)}>Open folder</MenuItem>
            </Menu>
          </div>
        }
        title={ alignment.filename }
        subheader={ Size }
      />
      <CardContent>
        <div className={classes.partitionFileContainer}>
          <code className={classes.partitionFileContent}>
            { alignment.partitionFileContent }
          </code>
        </div>
      </CardContent>
    </Card>
  );
};
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>


AlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

FinalAlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

const AlignmentCardObserver = observer(AlignmentCard)
const FinalAlignmentCardObserver = observer(FinalAlignmentCard)

export default AlignmentCardObserver;
export { FinalAlignmentCardObserver as FinalAlignmentCard }
