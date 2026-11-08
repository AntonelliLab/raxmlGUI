import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import React from 'react';

export interface ModifiedDialogProps {
  show: boolean;
  onClose: () => void;
  messages: string[];
}

export default function ModifiedDialog( {
  show,
  onClose,
  messages,
}: ModifiedDialogProps ) {
  if ( !show ) {
    return null;
  }

  return (
    <Dialog onClose={onClose} aria-labelledby="error-dialog-title" open={true}>
      <DialogTitle id="error-dialog-title">{'Attention'}</DialogTitle>
      <DialogContent>
        {
          'This will be using a copy of your input file, because there were some issues!'
        }
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
                {messages.map( ( message ) => (
                  <Typography key={message} variant="body2">
                    {message}
                  </Typography>
                ) )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
