import React from 'react';
import { observer } from 'mobx-react-lite';
import PropTypes from 'prop-types';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';


const OptionSelect = observer(({ option, sx }) => {
  if (option.notAvailable || option.options.length === 0) {
    return null;
  }
  if (option.options.length === 1) {
    // No options to change to, render as a text field instead.
    return (
      (<TextField
        variant="standard"
        id={option.title}
        helperText={option.title}
        sx={sx}
        value={option.value}
        placeholder={option.placeholder}
        error={option.error}
        slotProps={{
          input: {
            readOnly: true,
          }
        }} />)
    );
  }

  return (
    <FormControl variant="standard" sx={sx} title={option.hoverInfo}>
      <Select
        value={option.value}
        onChange={(e) => option.setValue(e.target.value)}
        inputProps={{
          name: option.title,
          id: option.title,
        }}
        error={option.error}
        multiple={option.multiple}>
        {option.options.map(({ value, title }, index) => (
          <MenuItem key={index} value={value}>
            {title}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{option.title}</FormHelperText>
    </FormControl>
  );
});

OptionSelect.propTypes = {
  option: PropTypes.object.isRequired,
  sx: PropTypes.object,
};

export default OptionSelect;
