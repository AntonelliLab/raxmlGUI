// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Button from '@material-ui/core/Button';

import type { Run } from '../reducers/types';

import RgStartRunButton from './button/RgStartRunButton';

import * as actions from '../actions';

import './RgAnalysisPanel.css';

type Props = {
  history: {
    goBack: () => void
  },
  removeRun: () => void,
  run: Run
};

class RgAnalysisPanel extends Component<Props> {
  props: Props;

  onClickClear = run => {
    this.props.removeRun(run);
    this.props.history.goBack();
  };

  render() {
    const { run } = this.props;
    return (
      <div className="analysis-panel">
        <Button
          className="button"
          variant="contained"
          color="primary"
          onClick={() => this.onClickClear(run)}
        >
          Clear
        </Button>
        <RgStartRunButton run={run} />
      </div>
    );
  }
}

export default withRouter(
  connect(
    undefined,
    actions
  )(RgAnalysisPanel)
);
