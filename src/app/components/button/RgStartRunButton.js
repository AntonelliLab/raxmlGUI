// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';

import type { Run } from '../../reducers/types';

import { startRun } from '../../actions';

type Props = {
  run: Run,
  startRun: () => void
};

/**
 * A component to start the calculation for a single run.
 */
class RgStartRunButton extends Component<Props> {
  props: Props;

  onClickRun = () => {
    const { run } = this.props;
    this.props.startRun(run);
  };

  render() {
    return (
      <Button
        className="button"
        variant="contained"
        color="primary"
        onClick={() => this.onClickRun()}
      >
        Run
      </Button>
    );
  }
}

export default connect(
  undefined,
  { startRun }
)(RgStartRunButton);
