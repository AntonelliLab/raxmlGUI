// @flow
import React, { Component } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { observer } from 'mobx-react';

import type { Run } from '../../reducers/types';

import { settings } from '../../../settings/analysis';

const { shlike } = settings;

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * The toggle component to add a complete SH-like calculation run to the calculation list.
 */
class RgSHLikeBoolean extends Component<Props> {
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
    const shArgs = Object.assign({}, shlike[0].argsList[0], run.globalArgs);
    shArgs.n = `${run.outFilename}${shlike[0].outputExt}`;
    // Add or remove the SH-like arguments on the end of the args list
    !enabled ? updatedRun.argsList.push(shArgs) : updatedRun.argsList.pop();
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
            value="sh"
            color="primary"
          />
        }
        label="SH-like values"
      />
    );
  }
}

export default observer(RgSHLikeBoolean);
