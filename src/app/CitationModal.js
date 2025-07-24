import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import CodeHighlight from './components/CodeHighlight';

function CitationModal({ citation }) {

  return (
    <Card
      elevation={0}
      sx={{
        backgroundColor: (theme) => theme.palette.output.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '700px'
      }}
    >
      <CardContent
        sx={{
          maxHeight: '600px',
          overflowY: 'auto'
        }}
      >
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
              sx={{
                backgroundColor: (theme) => theme.palette.output.background,
                borderRadius: '4px',
                padding: '4px'
              }}
            />
          </Box>
        ))}
      </CardContent>
      <CardActions sx={{ width: '100%' }}>
        <Box display="flex" justifyContent="flex-end" sx={{ width: '100%' }}>
          <Button
            aria-label="Copy to clipboard"
            variant="contained"
            color="secondary"
            onClick={citation.copyToClipboard}
            sx={{ marginRight: 10 }}
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
