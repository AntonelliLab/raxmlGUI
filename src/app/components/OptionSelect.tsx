import { observer } from 'mobx-react-lite';
import type { SxProps, Theme } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export interface OptionSelectChoice {
  value: string | number;
  title: string | number;
}

export interface OptionSelectOptionLike<Value extends string | number | readonly string[]> {
  notAvailable?: boolean;
  title: string;
  hoverInfo: string;
  options: readonly OptionSelectChoice[];
  value: Value;
  setValue: ( value: Value ) => void;
  multiple?: boolean;
  error: unknown;
  placeholder?: string;
}

export interface OptionSelectProps<Value extends string | number | readonly string[]> {
  option: OptionSelectOptionLike<Value>;
  sx?: SxProps<Theme>;
}

function OptionSelect<Value extends string | number | readonly string[]>( {
  option,
  sx,
}: OptionSelectProps<Value> ) {
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
        // MUI's change event types the value as `Value | string`.
        onChange={( e ) => option.setValue( e.target.value as Value )}
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
}

export default observer<typeof OptionSelect>( OptionSelect );
