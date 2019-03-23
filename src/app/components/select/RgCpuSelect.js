// @flow
import React, { Component } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { observer } from 'mobx-react';

import type { Run } from '../../reducers/types';



type Props = {
  run: Run,
  cpus: [],
};

/**
 * A component to show the available options for the number of threads to run the process in.
 * Available options go from one up to the nuber of cores on the machine, nuber of cores is checked in the electron process.
 */
class RgCpuSelect extends Component<Props> {
  props: Props;

  render() {
    const { run, classes } = this.props;
    return (
      <FormControl className={classes.formControl}>
        <InputLabel>Number of cpus</InputLabel>
        <Select
          value={run.numCpu}
          onChange={(_, item) => run.setNumCpu(item.props.value)}
          name="Number of cpus"
        >
          {run.cpuOptions.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
}

export default observer(RgCpuSelect);
