import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import CodeHighlight from './components/CodeHighlight';

const useStyles = makeStyles(theme => ({
  CitationModal: {
    backgroundColor: theme.palette.output.background,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '700px'
  },
  content: {
    maxHeight: '600px',
    overflowY: 'auto'
  },
  code: {
    // backgroundColor: theme.palette.console.background,
    backgroundColor: '#444',
    borderRadius: '4px',
    padding: '4px'
  }
}));

function CitationModal({ citation }) {
  const classes = useStyles();

  return (
    <Card className={classes.CitationModal} elevation={0}>
      <CardContent className={classes.content}>
        <Typography variant="h4">How to cite?</Typography>
        <Box>
          Please include the following references in your preferred format:
        </Box>
        <Box mt={1}>
          <ToggleButtonGroup
            value={citation.format}
            exclusive
            onChange={(_, format) => citation.setFormat(format)}
            aria-label="text format"
            size="small"
          >
            {citation.formats.map(format => (
              <ToggleButton
                key={format.value}
                value={format.value}
                aria-label={format.name}
              >
                {format.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        {citation.content.map(article => (
          <Box key={article.name} mt={2}>
            <Typography variant="subtitle2">{article.name}</Typography>
            <CodeHighlight
              code={article[citation.format]}
              language={citation.format}
              className={classes.code}
            />
          </Box>
        ))}
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
  citation: PropTypes.object.isRequired
};

export default observer(CitationModal);
