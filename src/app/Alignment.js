import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import IconDelete from '@material-ui/icons/Delete';
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
  Alignment: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    backgroundColor: '#393939',
    border: `1px solid #999`
  },
  card: {
    // width: '350px',
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

function Alignment({ className, alignment }) {
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
    <Chip className={classes.chip} label={dataType} color="secondary" />
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
      <div className={classes.remove}>
        <Button variant="outlined" color="default" onClick={alignment.remove}>
          <IconDelete />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={classNames(className, classes.card)} raised>
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
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>Show aligment</MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openFolder)}>Show folder</MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.setShowPartition)}>Show partition</MenuItem>
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


Alignment.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default observer(Alignment);
