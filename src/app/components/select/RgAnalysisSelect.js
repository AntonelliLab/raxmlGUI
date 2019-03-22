// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import type { Run } from '../../reducers/types';

import { updateRun } from '../../actions';

import { settings } from '../../settings/analysis';

const { analysesOptions } = settings;

type Props = {
  run: Run,
  updateRun: () => void
};

/**
 * A component to show the available options of analyses.
 */
class RgAnalysisSelect extends Component<Props> {
  props: Props;

  onChange(event) {
    const { run } = this.props;
    const { value } = event.target;

    const selectedOption = analysesOptions.filter(o => o.value === value)[0];
    const runArgsList = selectedOption.argsList.map(args =>
      Object.assign({}, args, run.globalArgs)
    );

    const updatedRun = Object.assign({}, run);
    // Attach new filename to this analysis
    runArgsList[0].n = `${run.outFilename}${
      selectedOption.outputExt
    }`;
    updatedRun.argsList = runArgsList;
    updatedRun.analysisType = value;
    this.props.updateRun(updatedRun);
  }

  renderOptions() {
    return analysesOptions.map(i => (
      <MenuItem key={i.title} value={i.value}>
        {i.title}
      </MenuItem>
    ));
  }

  render() {
    const { run } = this.props;
    return (
      <FormControl>
        <InputLabel>Analysis</InputLabel>
        <Select
          value={run.analysisType}
          onChange={this.onChange.bind(this)}
          name="analysis"
        >
          {this.renderOptions()}
        </Select>
      </FormControl>
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgAnalysisSelect);
