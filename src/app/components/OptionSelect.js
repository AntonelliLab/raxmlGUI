import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';


const OptionSelect = observer(({ option, className }) => {
  if (option.notAvailable || option.options.length === 0) {
    return null;
  }
  if (option.options.length === 1) {
    // No options to change to, render as a text field instead.
    return (
      <TextField
        id={option.title}
        helperText={option.title}
        className={className}
        value={option.value}
        placeholder={option.placeholder}
        error={option.error}
        InputProps={{
          readOnly: true,
        }}
      />
    )
  }

  return (
    <FormControl className={className} title={option.hoverInfo}>
      <Select
        value={option.value}
        onChange={(e) => option.setValue(e.target.value)}
        inputProps={{
          name: option.title,
          id: option.title,
        }}
        error={option.error}
        multiple={option.multiple}
      >
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
  className: PropTypes.string,
};

export default OptionSelect;
