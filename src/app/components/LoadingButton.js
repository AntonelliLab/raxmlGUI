import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { Box } from '@mui/material';

function LoadingButton(props) {
  const { loading, ...buttonProps } = props;
  const disabled = (loading || buttonProps.disabled);

  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        variant="contained"
        disabled={disabled}
        {...buttonProps}
      >
        {props.children}
      </Button>
      {loading && <CircularProgress size={24} sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
        pointerEvents: 'none',
      }}
      />}
    </Box>
  );
}

LoadingButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
  noDisabled: PropTypes.bool,
};

export default LoadingButton;
