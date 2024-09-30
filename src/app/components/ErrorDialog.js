import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
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

  const resetAndClose = () => {
    setReported(false);
    onClose();
  };

  const closeHandler = needReload ? handleReload : resetAndClose;

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
    <Dialog
      onClose={resetAndClose}
      aria-labelledby="error-dialog-title"
      open={true}
    >
      <DialogTitle id="error-dialog-title">
        {title || 'Unexpected error'}
      </DialogTitle>
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
                <Typography
                  variant="body2"
                  style={{ maxWidth: 400, wordBreak: 'break-all' }}
                >
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
    <Dialog
      onClose={resetAndClose}
      aria-labelledby="error-dialog-title"
      open={true}
    >
      <DialogTitle id="error-dialog-title">{title || 'Error'}</DialogTitle>
      <DialogContent>
        {
          'RaxmlGUI2 encountered an error that you need to fix before you can continue.'
        }
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
