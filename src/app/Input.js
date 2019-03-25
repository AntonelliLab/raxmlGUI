import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { format } from 'd3-format';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';
import _ from "lodash";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({
  Input: {
    minHeight: '300px',
    padding: '10px',
  },
  files: {
    marginTop: '10px',
  },
  alignments: {
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
  }

});

const Input = withStyles(styles)(observer(({ classes, alignments }) => {
  function showStatus(alignment) {
    const { error, path, parsingComplete, typecheckingComplete } = alignment;
    if (error) {
      return <p>{error}</p>;
    }
    if (!parsingComplete || !typecheckingComplete) {
      return null;
    }
    return (
      <div>
        <Button
          className="button"
          variant="contained"
          color="primary"
          onClick={() => console.log(path)}
        >
          Open Folder
        </Button>
        <Button
          className="button"
          variant="contained"
          color="primary"
          onClick={() => console.log(path)}
        >
          Show
        </Button>
      </div>
    );
  }

  function renderProgress(alignment) {
    const {
      parsingComplete,
      typecheckingComplete,
      checkRunComplete
    } = alignment;
    if (!parsingComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p>Parsing alignment</p>
        </div>
      );
    }
    if (!typecheckingComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p>Typechecking alignment</p>
        </div>
      );
    }
    if (!checkRunComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p>Performing checkrun for alignment</p>
        </div>
      );
    }
    return null;
  };

  function renderAlignments() {
    return _.map(alignments.alignments, alignment => {
      const { name, path, fileFormat, dataType } = alignment;
      return (
        <li key={path}>
          {renderProgress(alignment)}
          <Button
            className="button"
            variant="contained"
            color="primary"
            onClick={() => alignments.removeAlignment(alignment)}
          >
            Clear
          </Button>
          <div>
            <Typography variant="body2" >Filename: {name}</Typography>
            <Typography variant="body2" >File format: {fileFormat}</Typography>
            <Typography variant="body2" >Data type: {dataType}</Typography>
          </div>
          <div>
            {showStatus(alignment)}
          </div>
        </li>
      );
    });
  }

  // const FileInfo = alignments.ok ? (
  //   <div className={classes.files}>
  //     <div className={classes.alignments}>
  //       Input
  //       <div className={classes.fileInfo}>
  //         <div>
  //           Path:
  //           <span className={classes.path} onClick={alignments.openInputFile}>
  //             { alignments.filename }
  //           </span>
  //         </div>
  //         <div>
  //           Size: { format(',')(alignments.size) } bytes
  //         </div>
  //         <div>
  //           Type: Not detected yet
  //         </div>
  //       </div>
  //     </div>
  //     <div className={classes.output}>
  //       Output
  //       <div className={classes.fileInfo}>
  //         <div>
  //           Path:
  //           <span className={classes.path} onClick={alignments.openOutDir}>
  //             { alignments.outDir }
  //           </span>
  //         </div>
  //         <Button size="small" variant="outlined" className={classes.changeOutDir} onClick={alignments.selectOutDir}>
  //           Change
  //           <FolderIcon className={classNames(classes.rightIcon, classes.iconSmall)} />
  //         </Button>
  //       </div>
  //     </div>
  //   </div>
  // ) : null;

  return (
    <div className={classes.Input}>
      <Button variant="contained" color="primary" onClick={alignments.loadAlignmentFiles}>
        Open files
      </Button>
      <Button variant="contained" color="primary" onClick={alignments.removeAllAlignments}>
        Clear all
      </Button>
      {/* { FileInfo } */}
      <ul>
        {renderAlignments()}
      </ul>
    </div>
  );
}));


Input.propTypes = {
  classes: PropTypes.object.isRequired,
  alignments: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(Input));
