import React from 'react';
import { observer } from 'mobx-react-lite';
import type { SxProps, Theme } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FormControl } from '@mui/material';

export type OptionCheckOptionLike = {
  title: string;
  value: boolean;
  setValue: (value: boolean) => void;
  notAvailable: boolean;
  hoverInfo: string;
};

export type OptionCheckProps = {
  option: OptionCheckOptionLike;
  sx?: SxProps<Theme>;
};

const OptionCheck = observer(function OptionCheck({ option, sx }: OptionCheckProps) {
  if (option.notAvailable) {
    return null;
  }
  return (
    <FormControl variant="standard" sx={sx} title={option.hoverInfo}>
      <FormControlLabel
        control={
          <Checkbox
            checked={option.value}
            onChange={(e) => option.setValue(e.target.checked)}
            value={option.title}
            color="primary"
          />
        }
        label={option.title}
      />
    </FormControl>
  );
});

export default OptionCheck;
