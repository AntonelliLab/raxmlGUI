// @flow
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';

type Props = {
  run: Run,
  loadTreeFile: () => void
};

/**
 * A component to load a tree file for a single run.
 */
class RgLoadTreeFileButton extends Component<Props> {
  props: Props;

  onLoadTreeFile() {
    const { run } = this.props;
    // The new tree file is stored in the global args for the run
    run.loadTreeFile();
  }

  render() {
    return (
      <Button
        className="button"
        variant="contained"
        color="secondary"
        onClick={() => this.onLoadTreeFile()}
      >
        Load tree file
      </Button>
    );
  }
}

export default RgLoadTreeFileButton;
