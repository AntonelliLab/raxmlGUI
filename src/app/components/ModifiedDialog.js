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

export default function ModifiedDialog({ show, onClose, messages }) {
  if (!show) {
    return null;
  }

  const GenericDialog = (
    <Dialog onClose={onClose} aria-labelledby="error-dialog-title" open={true}>
      <DialogTitle id="error-dialog-title">{'Attention'}</DialogTitle>
      <DialogContent>
        {'This will be using a copy of your input file, because there were some issues!'}
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
                {messages.map((message) => (
                  <Typography key={message} variant="body2">
                    {message}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  let returnDialog = GenericDialog;
  return returnDialog;
}

ModifiedDialog.propTypes = {
  error: PropTypes.object,
  onClose: PropTypes.func.isRequired,
}
