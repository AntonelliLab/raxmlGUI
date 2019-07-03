import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';


const OptionCheck = observer(({ option, className }) => {
  if (option.notAvailable) {
    return null;
  }
  return (
    <FormControlLabel className={className}
      control={
        <Checkbox checked={option.value} onChange={e => option.setValue(e.target.checked)} value={option.title} color="primary" />
      }
      label={option.title}
    />
  );
});

OptionCheck.propTypes = {
  option: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default OptionCheck;
