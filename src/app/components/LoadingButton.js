import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@mui/styles';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const useStyles = makeStyles(theme => ({
  wrapper: {
    position: 'relative',
  },
  progress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    pointerEvents: 'none',
  },
}));

function LoadingButton(props) {
  const classes = useStyles();
  const { loading, className, ...buttonProps } = props;
  const disabled = (loading || buttonProps.disabled);

  return (
    <div className={clsx(classes.wrapper, className)}>
      <Button
        variant="contained"
        disabled={disabled}
        classes={{
          root: classes.primaryButton,
        }}
        {...buttonProps}
      >
        { props.children }
      </Button>
      {loading && (
        <CircularProgress
          size={24}
          className={classes.progress}
        />
      )}
    </div>
  );
}

LoadingButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
  noDisabled: PropTypes.bool,
};

export default LoadingButton;
