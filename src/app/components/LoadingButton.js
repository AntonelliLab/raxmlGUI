import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles(theme => ({
  wrapper: {
    position: 'relative',
  },
  progress: {
    // color: green[500],
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
  const { loading, noDisabled, className, buttonClassName, progressProps = {}, ...buttonProps } = props;
  const disabled = !noDisabled && (loading || buttonProps.disabled);

  return (
    <div className={clsx(classes.wrapper, className)}>
      <Button
        disabled={disabled}
        {...buttonProps}
      >
        { props.children }
      </Button>
      {loading && (
        <CircularProgress size={24} className={classes.progress} {...progressProps} />
      )}
    </div>
  );
}

LoadingButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
  buttonClassName: PropTypes.string,
  progressProps: PropTypes.object,
  noDisabled: PropTypes.bool,
};

// LoadingButton.defaultProps = {
//   buttonProps: {},
//   progressProps: {},
// }

export default LoadingButton;
