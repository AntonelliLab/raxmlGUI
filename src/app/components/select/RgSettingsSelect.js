// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormHelperText from '@material-ui/core/FormHelperText';

import type { Run } from '../../reducers/types';

import { updateRun } from '../../actions';

type Props = {
  run: Run,
  index: number,
  option: {},
  globalArg: [],
  title: string,
  description: string,
  options: [],
  updateRun: () => void,
  onChange: () => void
};

/**
 * A component to show the available options of a multistate setting.
 * The default value is checked on mount.
 */
class RgSettingsSelect extends Component<Props> {
  props: Props;

  INITIAL_STATE = {
    value: undefined
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  componentDidMount() {
    const { option } = this.props;
    if (option.default) {
      this.setState({ value: option.default });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { run, option, index } = this.props;
    if (!run || !run.argsList[index]) {
      return;
    }
    if (!run.argsList[index][option.argument]) {
      this.updateRun(option.default);
    }
  }

  onChange(event) {
    const { value } = event.target;
    const { onChange } = this.props;

    // If the value change should be handled by HOC
    if (onChange) {
      console.log('send value to HOC');
      onChange(value);
      this.setState({ value });
      return;
    }
    this.updateRun(value);
    this.setState({ value });
  }

  updateRun(value) {
    const { run, index, option, globalArg } = this.props;
    const updatedRun = Object.assign({}, run);
    if (globalArg) {
      updatedRun.globalArgs[option.argument] = value;
    } else {
      updatedRun.argsList[index][option.argument] = value;
    }
    this.props.updateRun(updatedRun);
  }

  renderOptions(options) {
    if (!options) {
      return null;
    }
    return options.map(i => (
      <MenuItem key={i} value={i}>
        {i}
      </MenuItem>
    ));
  }

  render() {
    const { value } = this.state;
    const { title, description, option, options } = this.props;
    return (
      <FormControl>
        <InputLabel>{title}</InputLabel>
        <Select value={value} onChange={this.onChange.bind(this)}>
          {this.renderOptions(option.options || options)}
        </Select>
        <FormHelperText>{description}</FormHelperText>
      </FormControl>
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgSettingsSelect);
