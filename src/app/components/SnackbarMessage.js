import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { amber } from '@mui/material/colors';
import IconButton from '@mui/material/IconButton';
import SnackbarContent from '@mui/material/SnackbarContent';
import WarningIcon from '@mui/icons-material/Warning';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const useStyles = makeStyles((theme) => ({
  success: {
    backgroundColor: theme.palette.output.main,
  },
  error: {
    // backgroundColor: theme.palette.error.main,
    backgroundColor: '#f2401b',
  },
  info: {
    backgroundColor: theme.palette.input.main,
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
    color: theme.palette.primary.contrastText,
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
        <IconButton
          key="close"
          aria-label="close"
          color="inherit"
          onClick={onClose}
          size="large">
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
