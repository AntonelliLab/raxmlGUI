// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import type { Run } from '../../reducers/types';

import RgSettingsSelect from './RgSettingsSelect';

import { updateRun } from '../../actions';

import { runSettings } from '../../settings/run';

const {
  aminoAcidSubstitutionModelOptions,
  aminoAcidSubstitutionMatrixOptions
} = runSettings;

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * A component to show the available options for the amino acid substitution model settings.
 */
class RgAAModelSelect extends Component<Props> {
  props: Props;

  INITIAL_STATE = {
    aaModel: aminoAcidSubstitutionModelOptions.default,
    aaMatrix: aminoAcidSubstitutionMatrixOptions.default,
    empiricFreq: '',
    enabled: undefined,
    m: ''
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  updateRun(newArg) {
    const { run } = this.props;
    const updatedRun = Object.assign({}, run);
    updatedRun.globalArgs.m = newArg;
    this.props.updateRun(updatedRun);
  }

  onModelChange(value) {
    const { aaMatrix, empiricFreq } = this.state;
    this.setState({ aaModel: value });
    const newArg = `${value}${aaMatrix}${empiricFreq}`;
    this.updateRun(newArg);
  }

  onMatrixChange(value) {
    const { aaModel, empiricFreq } = this.state;
    this.setState({ aaMatrix: value });
    const newArg = `${aaModel}${value}${empiricFreq}`;
    this.updateRun(newArg);
  }

  onEmpiricFreqChange() {
    const { enabled } = this.state;
    const { aaModel, aaMatrix } = this.state;
    const newValue = !enabled ? 'F' : '';
    this.setState({ empiricFreq: newValue, enabled: !enabled });
    const newArg = `${aaModel}${aaMatrix}${newValue}`;
    this.updateRun(newArg);
  }

  render() {
    const { enabled } = this.state;
    return (
      <div>
        <RgSettingsSelect
          onChange={newValue => this.onModelChange(newValue)}
          description="Amino acid substitution model."
          option={aminoAcidSubstitutionModelOptions}
        />
        <RgSettingsSelect
          onChange={newValue => this.onMatrixChange(newValue)}
          description="Amino acid substitution matrix."
          option={aminoAcidSubstitutionMatrixOptions}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={enabled}
              onChange={this.onEmpiricFreqChange.bind(this)}
              value="empFreq"
              color="primary"
            />
          }
          label="Emp. Freq."
        />
      </div>
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgAAModelSelect);
