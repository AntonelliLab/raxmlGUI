import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContentText from '@material-ui/core/DialogContentText';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Button from '@material-ui/core/Button';
import { ipcRenderer } from 'electron';
import SnackbarMessage from './SnackbarMessage';
import { reportIssueToGitHub, getMailtoLinkToReportError } from '../../common/utils';
import * as ipc from '../../constants/ipc';

const handleReload = () => {
  ipcRenderer.send(ipc.RELOAD);
}

export default function ErrorDialog({ error, onClose, needReload, title }) {
  const [reported, setReported] = React.useState(false);

  if (!error) {
    return null;
  }

  const handleReportToGithub = () => {
    reportIssueToGitHub(error);
    setReported(true);
  }

  const handleReportToMail = () => {
    setReported(true);
  }

  const mailtoContent = getMailtoLinkToReportError(error);

  const closeMessage = needReload ? (
    reported ? 'Reload' : 'Ignore and reload'
  ) : 'Close';
  const closeHandler = needReload ? handleReload : onClose;

  const CloseAction = (
    <DialogActions>
      <Button onClick={closeHandler} variant="contained" color="primary">
        {closeMessage}
      </Button>
    </DialogActions>
  );

  const Actions = reported ? CloseAction : (
    <DialogActions>
      <Button onClick={closeHandler} color="secondary">
        { closeMessage }
      </Button>
      <Button href={mailtoContent} onClick={handleReportToMail} variant="contained" color="primary" autoFocus>
        Report issue on mail
      </Button>
      <Button onClick={handleReportToGithub} variant="contained" color="primary" autoFocus>
        Report issue on GitHub
      </Button>
    </DialogActions>
  );

  const Message = !reported ? (
    <DialogContentText>
      Please help us solve the issue by reporting it.
    </DialogContentText>
  ) : (
    <SnackbarMessage variant="success" message="Thanks for reporting the issue!"/>
  );

  const GenericErrorDialog = (
    <Dialog onClose={onClose} aria-labelledby="error-dialog-title" open={true}>
      <DialogTitle id="error-dialog-title">{title || 'Unexpected error'}</DialogTitle>
      <DialogContent>
        <Box p={1}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="error-panel-content"
              id="error-panel-header"
            >
              <Typography>Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="h6">{error.name}</Typography>
                <Typography variant="body2" style={{ maxWidth: 400, wordBreak: 'break-all' }}>
                  {error.message}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
        {Message}
      </DialogContent>
      {Actions}
    </Dialog>
  );

  const UserFixErrorDialog = (
    <Dialog onClose={onClose} aria-labelledby="error-dialog-title" open={true}>
      <DialogTitle id="error-dialog-title">{title || 'Error'}</DialogTitle>
      <DialogContent>
        {"RaxmlGUI2 encountered an error that you need to fix before you can continue."}
        <Typography variant="body2" style={{ wordBreak: 'break-all' }}>
          {error.message}
        </Typography>
      </DialogContent>
      {CloseAction}
    </Dialog>
  );

  let returnDialog = GenericErrorDialog;
  if (error.isUserFix) {
    returnDialog = UserFixErrorDialog;
  }

  return returnDialog;
}

ErrorDialog.propTypes = {
  error: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  needReload: PropTypes.bool,
  title: PropTypes.string,
}
