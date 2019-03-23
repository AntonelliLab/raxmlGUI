// @flow
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';

import type { Run } from '../../reducers/types';

type Props = {
  run: Run,
  selectWorkingDirectory: () => void
};

/**
 * A component to change the working directory for a single run.
 */
class RgWorkingDirectorySelectButton extends Component<Props> {
  props: Props;

  render() {
    const { classes, run } = this.props;
    return (
      <Button
        size="small"
        variant="outlined"
        className={classes.changeOutDir}
        onClick={run.selectWorkingDirectory}
      >
        Select working directory
        <FolderIcon className={classNames(classes.rightIcon, classes.iconSmall)} />
      </Button>
    );
  }
}

export default observer(RgWorkingDirectorySelectButton);
