import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import { amber, green } from '@material-ui/core/colors';
import IconButton from '@material-ui/core/IconButton';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const useStyles = makeStyles(theme => ({
  success: {
    backgroundColor: green[700],
  },
  error: {
    // backgroundColor: theme.palette.error.main,
    backgroundColor: '#f2401b',
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    color: 'white',
  },
}));

function SnackbarMessage(props) {
  const classes = useStyles();
  const { className, message, error, onClose, variant, ...other } = props;
  const Icon = variantIcon[variant];

  const Message = error ? (
    <div>
      <Box mb={1}>
        <strong>{error.name}:</strong> {error.message}
      </Box>
      <div>Details:</div>
      <small>{JSON.stringify(error)}</small>
    </div>
  ) : message;

  return (
    <SnackbarContent
      className={clsx(classes[variant], className)}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          { Message }
        </span>
      }
      action={onClose ? [
        <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
          <CloseIcon className={classes.icon} />
        </IconButton>,
      ] : null }
      {...other}
    />
  );
}

SnackbarMessage.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.object,
  onClose: PropTypes.func,
  variant: PropTypes.oneOf(['error', 'info', 'success', 'warning']).isRequired,
};

export default SnackbarMessage;
