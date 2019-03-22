// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';

import type { Run } from '../../reducers/types';

import { selectWorkingDirectory } from '../../actions';

type Props = {
  run: Run,
  selectWorkingDirectory: () => void
};

/**
 * A component to change the working directory for a single run.
 */
class RgWorkingDirectorySelectButton extends Component<Props> {
  props: Props;

  onSelectWorkingDirectoryClick() {
    const { run } = this.props;
    // The new working directory is stored in the global args for the run
    this.props.selectWorkingDirectory(run);
  }

  render() {
    return (
      <Button
        className="button"
        variant="contained"
        color="primary"
        onClick={() => this.onSelectWorkingDirectoryClick()}
      >
        Select working directory
      </Button>
    );
  }
}

export default connect(
  undefined,
  { selectWorkingDirectory }
)(RgWorkingDirectorySelectButton);
