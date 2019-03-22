// @flow
import React, { Component } from 'react';
import _ from 'lodash';
import { withRouter } from 'react-router';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

import type { Alignments } from '../reducers/types';

import './RgAlignmentList.css';

type Props = {
  history: {
    push: () => void
  },
  onFolderOpen: () => void,
  alignments: Alignments,
  removeAlignment: () => void
};

/**
 * Component to show a list of alignments.
 */
class RgAlignmentList extends Component<Props> {
  props: Props;

  showSequences(alignmentPath) {
    // Route to alignment viewer screen
    // Pass alignment path as id to this window
    this.props.history.push({
      pathname: '/alignment',
      state: { alignmentPath }
    });
  }

  showStatus(alignment) {
    const { error, path, parsingComplete, typecheckingComplete } = alignment;
    if (error) {
      return <p className="red-text">{error}</p>;
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
          onClick={() => this.props.onFolderOpen(path)}
        >
          Open Folder
        </Button>
        <Button
          className="button"
          variant="contained"
          color="primary"
          onClick={() => this.showSequences(path)}
        >
          Show
        </Button>
      </div>
    );
  }

  renderProgress = alignment => {
    const {
      parsingComplete,
      typecheckingComplete,
      checkRunComplete
    } = alignment;
    if (!parsingComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p className="red-text">Parsing alignment</p>
        </div>
      );
    }
    if (!typecheckingComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p className="red-text">Typechecking alignment</p>
        </div>
      );
    }
    if (!checkRunComplete) {
      return (
        <div>
          <CircularProgress thickness={7} />
          <p className="red-text">Performing checkrun for alignment</p>
        </div>
      );
    }
    return null;
  };

  renderAlignments() {
    return _.map(this.props.alignments, alignment => {
      const { name, path, fileFormat, dataType } = alignment;
      return (
        <li className="collection-item avatar" key={path}>
          {this.renderProgress(alignment)}
          <Button
            className="button"
            variant="contained"
            color="primary"
            onClick={() => this.props.removeAlignment(alignment)}
          >
            Clear
          </Button>
          <div style={styles.fileName}>
            <Typography variant="body2" >Filename: {name}</Typography>
            <Typography variant="body2" >File format: {fileFormat}</Typography>
            <Typography variant="body2" >Data type: {dataType}</Typography>
          </div>
          <div className="secondary-content" style={styles.secondaryContent}>
            {this.showStatus(alignment)}
          </div>
        </li>
      );
    });
  }

  render() {
    return (
      <ul className="collection alignment-list">{this.renderAlignments()}</ul>
    );
  }
}

const styles = {
  secondaryContent: {
    zIndex: 1,
    width: '180px',
    top: 'auto',
    botton: 'auto'
  },
  fileName: {
    width: '65%'
  }
};

export default withRouter(RgAlignmentList);
