import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { format } from 'd3-format';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';

const styles = theme => ({
  Input: {
    // flexGrow: 1,
    minHeight: '300px',
    padding: '10px',
  },
  files: {
    marginTop: '10px',
    // border: '1px solid #999',
    // padding: '10px',
  },
  input: {
    // borderLeft: `3px solid ${theme.palette.primary.main}`,
    // paddingLeft: '5px',
  },
  output: {
    marginTop: '20px',
    // borderLeft: `3px solid ${theme.palette.primary.main}`,
    // paddingLeft: '5px',
  },
  fileInfo: {
    fontSize: '0.75em',
    marginTop: '0.25em',
    overflowWrap: 'break-word',
  },
  path: {
    cursor: 'pointer',
  },
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },
  outputButton: {
    marginLeft: theme.spacing.unit,
  }

});

const Input = withStyles(styles)(observer(({ classes, input }) => {

  const FileInfo = input.ok ? (
    <div className={classes.files}>
      <div className={classes.input}>
        Input
        <div className={classes.fileInfo}>
          <div>
            <span className={classes.path} onClick={input.openInputFile}>
              Path: { input.filename }
            </span>
          </div>
          <div>
            Size: { format(',')(input.size) } bytes
          </div>
          <div>
            Type: Not detected yet
          </div>
        </div>
      </div>
      <div className={classes.output}>
        Output
        <div className={classes.fileInfo}>
          <div>
            <span className={classes.path} onClick={input.openOutDir}>
              Path: { input.outDir }
            </span>
            <Button size="small" onClick={input.selectOutDir}>
              <FolderIcon className={classNames(classes.leftIcon, classes.iconSmall)} />
              Change
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={classes.Input}>
      <Button variant="contained" color="primary" onClick={input.selectFile}>
        Open file
      </Button>
      { FileInfo }
    </div>
  );
}));
    

Input.propTypes = {
  classes: PropTypes.object.isRequired,
  input: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Input));