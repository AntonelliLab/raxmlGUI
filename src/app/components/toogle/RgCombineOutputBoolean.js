// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import type { Run } from '../../reducers/types';

import { updateRun } from '../../actions';

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * The toggle component to combine the outputs of a ML calculation.
 */
class RgCombineOutputBoolean extends Component<Props> {
  props: Props;

  onChange() {
    // Set updated run with toggled value
    const { run } = this.props;
    const updatedRun = Object.assign({}, run, { combineOutput: !run.combineOutput});
    this.props.updateRun(updatedRun);
  }

  render() {
    const { run } = this.props;
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={run.combineOutput}
            onChange={this.onChange.bind(this)}
            value="co"
            color="primary"
          />
        }
        label="combine output"
      />
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgCombineOutputBoolean);
