// @flow
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import FolderIcon from '@material-ui/icons/Folder';
import classNames from 'classnames';
import FormControl from '@material-ui/core/FormControl';

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
      <FormControl className={classes.formControl}>
        <Button
          variant="outlined"
          color="default"
          onClick={run.selectWorkingDirectory}
        >
          <FolderIcon
            className={classNames(classes.rightIcon, classes.iconSmall)}
          />
          Select working directory
        </Button>
      </FormControl>
    );
  }
}

export default observer(RgWorkingDirectorySelectButton);
