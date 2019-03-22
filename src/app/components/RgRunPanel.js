// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import type { Run } from '../reducers/types';

import RgOutFileNameInput from './input/RgOutFileNameInput';
import RgWorkingDirectorySelectButton from './button/RgWorkingDirectorySelectButton';
import RgCpuSelect from './select/RgCpuSelect';

import * as actions from '../actions';

import './RgRunPanel.css';

type Props = {
  run: Run
};

class RgRunPanel extends Component<Props> {
  props: Props;

  render() {
    const { run } = this.props;
    return (
      <div className="run-panel">
        <RgOutFileNameInput run={run} />
        <RgWorkingDirectorySelectButton run={run} />
        <RgCpuSelect run={run} />
      </div>
    );
  }
}

export default withRouter(
  connect(
    undefined,
    actions
  )(RgRunPanel)
);
