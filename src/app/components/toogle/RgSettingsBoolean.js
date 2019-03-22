// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import type { Run } from '../../reducers/types';

import { updateRun } from '../../actions';

type Props = {
  run: Run,
  index: number,
  option: {},
  defaultValue: boolean,
  description: string,
  updateRun: () => void
};

/**
 * A component to show boolean settings.
 */
class RgSettingsBoolean extends Component<Props> {
  props: Props;

  INITIAL_STATE = {
    enabled: undefined
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  componentDidMount() {
    const { defaultValue } = this.props;
    if (defaultValue) {
      this.setState({ enabled: defaultValue });
    }
  }

  onChange() {
    const { run, index, option } = this.props;
    const { enabled } = this.state;

    const updatedRun = Object.assign({}, run);
    updatedRun.argsList[index][option.argument] = !enabled;
    this.props.updateRun(updatedRun);
    this.setState({ enabled: !enabled });
  }

  render() {
    const { enabled } = this.state;
    const { description } = this.props;
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            onChange={this.onChange.bind(this)}
            color="primary"
          />
        }
        label={description}
      />
    );
  }
}

export default connect(
  undefined,
  { updateRun }
)(RgSettingsBoolean);
