import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FormControl } from '@mui/material';


const OptionCheck = observer(({ option, sx }) => {
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

OptionCheck.propTypes = {
  option: PropTypes.object.isRequired,
  sx: PropTypes.object,
};

export default OptionCheck;
