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
  render() {
    const { run } = this.props;
    return (
      <Button
        className="button"
        variant="contained"
        color="secondary"
        onClick={() => run.loadTreeFile()}
      >
        Load tree file
      </Button>
    );
  }
}

export default RgLoadTreeFileButton;
