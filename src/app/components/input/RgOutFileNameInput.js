// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Input, Typography } from '@material-ui/core';

import { updateRun } from '../../actions';

import type { Run } from '../../reducers/types';

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * A component to change the name of the outfile.
 */
class RgOutFileNameInput extends Component<Props> {
  props: Props;

  onInputChange(newValue) {
    const { run } = this.props;
    const updatedRun = Object.assign({}, run);
    updatedRun.outFilename = newValue;
    this.props.updateRun(updatedRun);
  }

  render() {
    const { run } = this.props;
    return (
      <div>
        <Typography variant='body2'>
          Outfile name
        </Typography>
        <Input
          value={run.outFilename}
          onChange={(event)  => this.onInputChange(event.target.value)}
        />
      </div>
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgOutFileNameInput);
