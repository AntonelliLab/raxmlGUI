import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
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
        label={option.title}
        title={option.hoverInfo}
        className={className}
        value={option.value}
        placeholder={option.placeholder}
        error={option.error}
        helperText={option.helperText}
        InputProps={{
          readOnly: true,
        }}
      />
    )
  }

  return (
    <FormControl className={className} title={option.hoverInfo}>
      <InputLabel style={{ whiteSpace: 'nowrap' }} htmlFor={option.title}>{option.title}</InputLabel>
      <Select
        value={option.value}
        onChange={e => option.setValue(e.target.value) }
        inputProps={{
          name: option.title,
          id: option.title,
        }}
        error={option.error}
        multiple={option.multiple}
      >
        {
          option.options.map(({value, title}, index) => <MenuItem key={index} value={value}>{title}</MenuItem>)
        }
      </Select>
    </FormControl>
  );
});

OptionSelect.propTypes = {
  option: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default OptionSelect;
