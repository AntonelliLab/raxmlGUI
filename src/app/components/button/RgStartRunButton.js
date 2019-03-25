// @flow
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';

import type { Run } from '../../reducers/types';

type Props = {
  run: Run,
};

/**
 * A component to start the calculation for a single run.
 */
class RgStartRunButton extends Component<Props> {
  props: Props;
  render() {
    const { classes, run } = this.props;
    return (
      <Button
        variant="contained"
        className={classes.button}
        disabled={run.startRunDisabled}
        color="primary"
        onClick={run.startRun}
      >
        Run
      </Button>
    );
  }
}

export default RgStartRunButton;
