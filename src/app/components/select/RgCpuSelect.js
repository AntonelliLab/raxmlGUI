// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

import type { Run } from '../../reducers/types';

import RgSettingsSelect from './RgSettingsSelect';

import { updateRun, getCPUs } from '../../actions';

import { runSettings } from '../../settings/run';

const { numberThreadsOption } = runSettings;

type Props = {
  run: Run,
  cpus: [],
  getCPUs: () => void
};

/**
 * A component to show the available options for the number of threads to run the process in.
 * Available options go from one up to the nuber of cores on the machine, nuber of cores is checked in the electron process.
 */
class RgCpuSelect extends Component<Props> {
  props: Props;

  // Getting the info about the cpu's of the machine can potentially be placed somewhere in the app start logic other than here
  componentDidMount() {
    this.props.getCPUs();
  }

  render() {
    const { run, cpus } = this.props;
    const options = [];
    let x = numberThreadsOption.min;
    while (x <= cpus.length) {
      options.push(x);
      x += 1;
    }
    return (
      <div>
        <RgSettingsSelect
          run={run}
          globalArg
          description="Number of threads."
          option={numberThreadsOption}
          options={options}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { cpus: state.app.cpus };
}

export default connect(
  mapStateToProps,
  { updateRun, getCPUs }
)(RgCpuSelect);
