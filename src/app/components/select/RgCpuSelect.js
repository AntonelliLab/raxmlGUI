// @flow
import React, { Component } from 'react';
import { observer } from 'mobx-react';

import RgSettingsSelect from './RgSettingsSelect';

import type { Run } from '../../../reducers/types';

import { runSettings } from '../../../settings/run';

const { numberThreadsOption } = runSettings;

type Props = {
  run: Run,
};

/**
 * A component to show the available options for the number of threads to run the process in.
 * Available options go from one up to the nuber of cores on the machine, nuber of cores is checked in the electron process.
 */
class RgCpuSelect extends Component<Props> {
  props: Props;

  render() {
    const { run } = this.props;
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
