import React from 'react';
import { observer } from 'mobx-react-lite';
import type { SxProps, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export type OptionTextFieldOptionLike = {
  title: string;
  value: string | number | boolean;
  setValue: (value: string) => void;
  notAvailable: boolean;
  hoverInfo: string;
  haveError: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export type OptionTextFieldProps = {
  option: OptionTextFieldOptionLike;
  sx?: SxProps<Theme>;
};

const OptionTextField = observer(function OptionTextField({
  option,
  sx,
}: OptionTextFieldProps) {
  if (option.notAvailable) {
    return null;
  }
  return (
    <TextField
      variant="standard"
      id={option.title}
      helperText={option.title}
      title={option.hoverInfo}
      disabled={option.disabled}
      sx={sx}
      value={option.value}
      placeholder={option.placeholder}
      onChange={(e) => option.setValue(e.target.value)}
      error={option.haveError}
    />
  );
});

export default OptionTextField;
