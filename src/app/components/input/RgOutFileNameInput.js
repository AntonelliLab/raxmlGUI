// @flow
import React, { Component } from 'react';
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import { observer } from 'mobx-react';

type Props = {
};

/**
 * A component to change the name of the outfile.
 */
class RgOutFileNameInput extends Component<Props> {
  props: Props;

  render() {
    const { classes, run } = this.props;
    return (
      <FormControl className={classes.formControl}>
        <TextField
          className={classes.textField}
          onChange={e => run.setOutFilename(e.target.value)}
          id="outName"
          value={run.outFilename}
          placeholder="Placeholder"
          helperText="Outfile name"
        />
      </FormControl>
    );
  }
}

export default observer(RgOutFileNameInput);
