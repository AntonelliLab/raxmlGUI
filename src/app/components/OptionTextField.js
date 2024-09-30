import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';

const OptionTextField = observer(({ option, className }) => {
  if (option.notAvailable) {
    return null;
  }
  return (
    <TextField
      id={option.title}
      helperText={option.title}
      title={option.hoverInfo}
      disabled={option.disabled}
      className={className}
      value={option.value}
      placeholder={option.placeholder}
      onChange={(e) => option.setValue(e.target.value)}
      error={option.haveError}
    />
  );
});

OptionTextField.propTypes = {
  option: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default OptionTextField;
