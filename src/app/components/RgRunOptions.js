// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

import type { Run } from '../reducers/types';

import RgSettingsBoolean from './toogle/RgSettingsBoolean';
import RgSHLikeBoolean from './toogle/RgSHLikeBoolean';
import RgBrLBoolean from './toogle/RgBrLBoolean';
import RgModelSelect from './select/RgModelSelect';
import RgSettingsSelect from './select/RgSettingsSelect';
import RgOutgroupSelect from './select/RgOutgroupSelect';

import { updateRun } from '../actions';

import './RgRunOptions.css';

import { runSettings } from '../settings/run';
import RgLoadTreeFileButton from './button/RgLoadTreeFileButton';
import RgCombineOutputBoolean from './toogle/RgCombineOutputBoolean';

const {
  numberRunsOptions,
  numberRepsOptions,
  printBranchLengthsBootstrapOption
} = runSettings;

type Props = {
  run: Run
};

class RgRunOptions extends Component<Props> {
  props: Props;

  renderOptions(run) {
    switch (run.analysisType) {
      case 'FT':
        // TODO fast tree search has an outgroup select, but it changes nothing in the args
        return (
          <div>
            <RgBrLBoolean run={run} />
            <RgSHLikeBoolean run={run} />
            <RgModelSelect run={run} />
          </div>
        );
      case 'ML':
        // TODO: the default number of runs seems not to be working
        // TODO: is probably the same ref as other settigs select dropdown when changing the screen
        return (
          <div>
            <RgOutgroupSelect run={run} index={0} />
            <RgSettingsSelect
              run={run}
              index={0}
              description="runs"
              option={numberRunsOptions}
            />
            <RgSHLikeBoolean run={run} />
            <RgCombineOutputBoolean run={run} />
            <RgModelSelect run={run} />
          </div>
        );
      case 'ML+BS':
        return (
          <div>
            <RgOutgroupSelect run={run} index={0} />
            <RgSettingsSelect
              run={run}
              index={0}
              description="reps."
              option={numberRepsOptions}
            />
            <RgSettingsBoolean
              run={run}
              index={0}
              option={printBranchLengthsBootstrapOption}
              description="Specifies that bootstrapped trees should be printed with branch lengths."
            />
            <RgModelSelect run={run} />
          </div>
        );
      case 'ML+tBS':
        return (
          <div>
            <RgOutgroupSelect run={run} indices={[0, 1]} />
            <RgSettingsSelect
              run={run}
              index={0}
              description="runs"
              option={numberRunsOptions}
            />
            <RgSettingsSelect
              run={run}
              index={1}
              description="reps."
              option={numberRepsOptions}
            />
            <RgSettingsBoolean
              run={run}
              index={0}
              option={printBranchLengthsBootstrapOption}
              description="Specifies that bootstrapped trees should be printed with branch lengths."
            />
            <RgModelSelect run={run} />
          </div>
        );
      case 'BS+con':
        return (
          <div>
            <RgOutgroupSelect run={run} index={0} />
            <RgSettingsSelect
              run={run}
              index={0}
              description="reps."
              option={numberRepsOptions}
            />
            <RgSettingsBoolean
              run={run}
              index={0}
              option={printBranchLengthsBootstrapOption}
              description="Specifies that bootstrapped trees should be printed with branch lengths."
            />
            <RgModelSelect run={run} />
          </div>
        );
      case 'AS':
        return (
          <div>
            <RgLoadTreeFileButton run={run} />
            <RgModelSelect run={run} />
          </div>
        );
      case 'PD':
        return (
          <div>
            <RgLoadTreeFileButton run={run} />
            <RgModelSelect run={run} />
          </div>
        );
      case 'RBS':
        return (
          <div>
            <RgModelSelect run={run} />
          </div>
        );
      default:
        return null;
    }
  }

  render() {
    const { run } = this.props;
    return <div className="RgRunOptions">{this.renderOptions(run)}</div>;
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgRunOptions);
