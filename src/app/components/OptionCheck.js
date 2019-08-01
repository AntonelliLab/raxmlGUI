import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { FormControl, FormHelperText } from '@material-ui/core';


const OptionCheck = observer(({ option, className }) => {
  if (option.notAvailable) {
    return null;
  }
  return (
    <FormControl title={option.hoverInfo}>
      <FormHelperText>{option.description}</FormHelperText>
      <FormControlLabel className={className}
        control={
          <Checkbox checked={option.value} onChange={e => option.setValue(e.target.checked)} value={option.title} color="primary" />
        }
        label={option.title}
      />
    </FormControl>
  )
});

OptionCheck.propTypes = {
  option: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default OptionCheck;
