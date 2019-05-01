import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
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
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';

const styles = theme => ({
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
    marginRight: theme.spacing.unit,
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

const Alignment = withStyles(styles)(observer(({ classes, className, alignment }) => {
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
    <Chip className={classes.chip} label={dataType} color="secondary" />
  ) : (
    <CircularProgress variant="indeterminate" size={20} />
  );

  const Check = alignment.checkRunComplete ? (
    <span>{ alignment.checkRunSuccess ? 'ok' : 'failed' }</span>
  ) : (
    <span>{ alignment.typecheckingComplete ? 'Checking...' : 'Pending...' }</span>
  );

  return (
    <Card className={classNames(className, classes.card)} raised>
      <CardHeader
        avatar={
          Type
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
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
      </CardContent>
    </Card>
  );
}));


Alignment.propTypes = {
  classes: PropTypes.object.isRequired,
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default withStyles(styles)(observer(Alignment));
