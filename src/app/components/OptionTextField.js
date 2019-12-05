import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

const OptionTextField = observer(({ option, className }) => {
  if (option.notAvailable) {
    return null;
  }
  return (
    <TextField
      id={option.title}
      label={option.title}
      className={className}
      value={option.value}
      placeholder={option.placeholder}
      onChange={e => option.setValue(e.target.value)}
      error={option.error}
      helperText={option.helperText}
    />
  );
});

OptionTextField.propTypes = {
  option: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default OptionTextField;
