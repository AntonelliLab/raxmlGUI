// @flow
import React, { Component } from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { observer } from 'mobx-react';

type Props = {
  run: Run,
  index: number,
  indices: [],
  updateRun: () => void
};

/**
 * A component to show the available options for the outgroup setting.
 */
class RgOutgroupSelect extends Component<Props> {
  props: Props;

  INITIAL_STATE = {
    value: 'none'
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  onChange(event) {
    const { value } = event.target;
    const { run, index, indices } = this.props;

    const updatedRun = Object.assign({}, run);
    let mapIndices;
    if (!indices) {
      mapIndices = [index];
    } else {
      mapIndices = indices;
    }
    mapIndices.map(i => {
      updatedRun.argsList[i].o = value;
      if (value === 'none') {
        delete updatedRun.argsList[i].o;
      }
      return true;
    });
    run.setArgsList(updatedRun.argsList);
    this.setState({ value });
  }

  renderOptions(run) {
    const sequenceIds = run.sequences.map(i => i.id);
    sequenceIds.push('none');
    return sequenceIds.map(i => (
      <MenuItem key={i} value={i}>
        {i}
      </MenuItem>
    ));
  }

  render() {
    const { value } = this.state;
    const { run } = this.props;
    return (
      <FormControl>
        <InputLabel>Outgroup</InputLabel>
        <Select value={value} onChange={this.onChange.bind(this)}>
          {this.renderOptions(run)}
        </Select>
      </FormControl>
    );
  }
}

export default observer(RgOutgroupSelect);
