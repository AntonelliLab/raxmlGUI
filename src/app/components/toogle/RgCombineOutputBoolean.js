// @flow
import React, { Component } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { observer } from 'mobx-react';

import type { Run } from '../../reducers/types';

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
    run.setCombineOutput(updatedRun.combineOutput);
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

export default observer(RgCombineOutputBoolean);
