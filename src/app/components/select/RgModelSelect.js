// @flow
import React, { Component } from 'react';

import type { Run } from '../../reducers/types';

import RgSettingsSelect from './RgSettingsSelect';
import RgAAModelSelect from './RgAAModelSelect';

import { runSettings } from '../../settings/run';

const {
  binarySubstitutionModelOptions,
  multistateSubstitutionModelOptions,
  nucleotideSubstitutionModelOptions,
  kMultistateSubstitutionModelOptions,
  mixedSubstitutionModelOptions
} = runSettings;

type Props = {
  run: Run
};

class RgModelSelect extends Component<Props> {
  props: Props;

  renderSelect() {
    const { run } = this.props;
    switch (run.dataType) {
      case 'binary':
        return (
          <RgSettingsSelect
            run={run}
            globalArg
            description="Binary substitution model."
            option={binarySubstitutionModelOptions}
          />
        );
      case 'dna':
        return (
          <RgSettingsSelect
            run={run}
            globalArg
            description="Nucleotide substitution model."
            option={nucleotideSubstitutionModelOptions}
          />
        );
      case 'multistate':
        return (
          <div>
            <RgSettingsSelect
              run={run}
              globalArg
              description="Multi-state substitution model."
              option={multistateSubstitutionModelOptions}
            />
            <RgSettingsSelect
              run={run}
              globalArg
              description="Specify one of the multi-state substitution models (max 32 states) implemented in RAxML."
              option={kMultistateSubstitutionModelOptions}
            />
          </div>
        );
      case 'protein':
        return <RgAAModelSelect run={run} />;
      case 'mixed':
        return (
          <RgSettingsSelect
            run={run}
            globalArg
            description="Substitution model."
            option={mixedSubstitutionModelOptions}
          />
        );
      default:
        return null;
    }
  }

  render() {
    return <div>{this.renderSelect()}</div>;
  }
}

export default RgModelSelect;
