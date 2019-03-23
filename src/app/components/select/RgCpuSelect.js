// @flow
import React, { Component } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { observer } from 'mobx-react';

import RgSettingsSelect from './RgSettingsSelect';

import type { Run } from '../../../reducers/types';


import { runSettings } from '../../../settings/run';

const { numberThreadsOption } = runSettings;

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
      <RgSettingsSelect
        run={run}
        globalArg
        description="Number of threads."
        option={numberThreadsOption}
        options={run.cpuOptions}
      />
    );
  }
}

export default observer(RgCpuSelect);
