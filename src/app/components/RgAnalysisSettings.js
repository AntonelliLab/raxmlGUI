// @flow
import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';

import type { Runs, Run } from '../reducers/types';

import RgAnalysisSelect from './select/RgAnalysisSelect';
import RgRunOptions from './RgRunOptions';

import * as actions from '../actions';

import './RgAnalysisSettings.css';

type Props = {
  runs: Runs,
  run: Run,
  showInFolder: () => void,
};

/**
 * Component to show a list of runs.
 */
class RgAnalysisSettings extends Component<Props> {
  props: Props;

  showStatus(run) {
    const {
      inFile,
      globalArgs,
      error
    } = run;
    if (error) {
      return <p className="red-text">{error}</p>;
    }
    return (
      <div>
        <Button
          className="button"
          variant="contained"
          color="primary"
          onClick={() => this.props.showInFolder(inFile)}
        >
          Input File
        </Button>
      </div>
    );
  }

  render() {
    const { run } = this.props;
    return (
      <div className="collection-item avatar">
        <div className="secondary-content" style={styles.secondaryContent}>
          {this.showStatus(run)}
        </div>
      </div>
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

function mapStateToProps(state) {
  const runs = _.map(state.runs);
  return { runs };
}

export default connect(
  mapStateToProps,
  actions
)(RgAnalysisSettings);
