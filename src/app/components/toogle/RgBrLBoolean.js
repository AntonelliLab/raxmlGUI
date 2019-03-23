// @flow
import React, { Component } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import type { Run } from '../../reducers/types';

import { settings } from '../../../settings/analysis';
import { observer } from 'mobx-react';

const { brL } = settings;

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * The toggle component to add a complete branch length calculation run to the calculation list.
 */
class RgBrLBoolean extends Component<Props> {
  props: Props;

  INITIAL_STATE = {
    enabled: false
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  onChange() {
    const { run } = this.props;
    // The previous enabled state
    const { enabled } = this.state;

    const updatedRun = Object.assign({}, run);
    const brLArgs = Object.assign({}, brL[0].argsList[0], run.globalArgs);
    brLArgs.n = `${run.outFilename}${brL[0].outputExt}`;
    // Add or remove the branch length arguments on the second position of the args list
    !enabled
      ? updatedRun.argsList.splice(1, 0, brLArgs)
      : updatedRun.argsList.splice(1, 1);
    // Set updated run
    run.setArgsList(updatedRun.argsList);
    this.setState({ enabled: !enabled });
  }

  render() {
    const { enabled } = this.state;
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            onChange={this.onChange.bind(this)}
            value="brL"
            color="primary"
          />
        }
        label="compute brL"
      />
    );
  }
}

export default observer(RgBrLBoolean);
