import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Box from '@material-ui/core/Box';
import CodeHighlight from './components/CodeHighlight';

const useStyles = makeStyles(theme => ({
  CitationModal: {
    backgroundColor: '#444',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '700px',
  },
  content: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  bib: {
    fontSize: 10,
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  }
}));

function CitationModal({ citation }) {
  const classes = useStyles();

  const code = citation.allText;
  return (
    <Card className={classes.CitationModal} elevation={0}>
      <CardContent className={classes.content}>
        <CodeHighlight code={code} language="bib" className={classes.bib} />
      </CardContent>
      <CardActions style={{ width: '100%' }}>
        <Box display="flex" justifyContent="flex-end" css={{ width: '100%' }}>
          <Button
            aria-label="Copy to clipboard"
            variant="contained"
            onClick={citation.copyToClipboard}
            style={{ marginRight: 10 }}
            >
            Copy to clipboard
            </Button>
          <Button aria-label="Close" variant="outlined" onClick={citation.hide}>
            Close
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}

CitationModal.propTypes = {
  citation: PropTypes.object.isRequired,
};

export default observer(CitationModal);
