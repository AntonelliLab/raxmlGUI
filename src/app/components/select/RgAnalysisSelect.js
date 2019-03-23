// @flow
import React, { Component } from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import type { Run } from '../../reducers/types';

import { settings } from '../../../settings/analysis';

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

  // TODO: this logic should probably go into the mobx thing
  onChange(event) {
    const { run } = this.props;
    const { value } = event.target;

    const selectedOption = analysesOptions.filter(o => o.value === value)[0];
    const runArgsList = selectedOption.argsList.map(args =>
      Object.assign({}, args, run.globalArgs)
    );

    const updatedRun = Object.assign({}, run);
    // Attach new filename to this analysis
    runArgsList[0].n = `${run.outFilename}${selectedOption.outputExt}`;
    updatedRun.argsList = runArgsList;
    updatedRun.analysisType = value;

    run.setArgsList(runArgsList);
    run.setAnalysisType(value);
  }

  renderOptions() {
    return analysesOptions.map(i => (
      <MenuItem key={i.title} value={i.value}>
        {i.title}
      </MenuItem>
    ));
  }

  render() {
    const { classes, run } = this.props;
    console.log('RgAnal', run.analysisType);
    return (
      <FormControl className={classes.formControl}>
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

export default RgAnalysisSelect;
