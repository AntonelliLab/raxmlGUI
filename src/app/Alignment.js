import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconDelete from '@material-ui/icons/Delete';
import { format } from 'd3-format';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';
import _ from "lodash";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Chip from "@material-ui/core/Chip";
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = theme => ({
  Alignment: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    backgroundColor: '#393939',
    border: `1px solid #999`
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    marginRight: theme.spacing.unit,
  },
  chip: {
    height: '20px',
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
  },
  loading: {
    marginLeft: '10px',
  },
  remove: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  }

});

const Alignment = withStyles(styles)(observer(({ classes, alignment }) => {
  const { base, filename, path, fileFormat, dataType, numSequences, length } = alignment;

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
    <Chip className={classes.chip} label={dataType} color="default" />
  ) : (
    <CircularProgress variant="indeterminate" size={20} />
  );

  const Check = alignment.checkRunComplete ? (
    <span>{ alignment.checkRunSuccess ? 'ok' : 'failed' }</span>
  ) : (
    <span>{ alignment.typecheckingComplete ? 'Checking...' : 'Pending...' }</span>
  );

  return (
    <div className={classes.Alignment}>
      <div>
        <div className={classes.heading}>
          <div className={classes.name}>{ filename }</div>
          <div>
            { Type }
          </div>
        </div>
        <div className={classes.fileInfo}>
          <div>
            <span className={classes.link} onClick={alignment.openFolder}>Open folder</span>
            <span className={classes.divider}>|</span>
            <span className={classes.link} onClick={alignment.openFile}>Open file</span>
          </div>
          <div>
            Size: { Size }
          </div>
          <div>
            Format: { alignment.fileFormat }
          </div>
          <div>
            Status: { alignment.status }
          </div>
        </div>
        <div>
        </div>
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
      { alignment.loading ? (
        <div className={classes.loading}>
          <CircularProgress variant="indeterminate" />
        </div>
      ) : null }
      <div className={classes.remove}>
        <Button variant="outlined" color="default" onClick={alignment.remove}>
          <IconDelete />
        </Button>
      </div>
    </div>
  );
}));


Alignment.propTypes = {
  classes: PropTypes.object.isRequired,
  alignment: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Alignment));
