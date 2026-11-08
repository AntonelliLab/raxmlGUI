import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { observer } from 'mobx-react-lite';
import React from 'react';

export interface OptionSelectChoice {
  value: string | number;
  title: string;
}

export interface OptionSelectOptionLike {
  notAvailable: boolean;
  title: string;
  hoverInfo: string;
  options: readonly OptionSelectChoice[];
  value: string | number | readonly string[];
  setValue: ( value: unknown ) => void;
  multiple?: boolean;
  error: unknown;
  placeholder?: string;
}

export interface OptionSelectProps {
  option: OptionSelectOptionLike;
  sx?: SxProps<Theme>;
}

const OptionSelect = observer( function OptionSelect( {
  option,
  sx,
}: OptionSelectProps ) {
  if ( option.notAvailable || option.options.length === 0 ) {
    return null;
  }
  if ( option.options.length === 1 ) {
    // No options to change to, render as a text field instead.
    return (
      <TextField
        variant="standard"
        id={option.title}
        helperText={option.title}
        sx={sx}
        value={option.value}
        placeholder={option.placeholder}
        error={Boolean( option.error )}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />
    );
  }

  return (
    <FormControl variant="standard" sx={sx} title={option.hoverInfo}>
      <Select
        value={option.value}
        onChange={( e ) => option.setValue( e.target.value )}
        inputProps={{
          name: option.title,
          id: option.title,
        }}
        error={Boolean( option.error )}
        multiple={option.multiple}
      >
        {option.options.map( ( { value, title }, index ) => (
          <MenuItem key={index} value={value}>
            {title}
          </MenuItem>
        ) )}
      </Select>
      <FormHelperText>{option.title}</FormHelperText>
    </FormControl>
  );
} );

export default OptionSelect;
