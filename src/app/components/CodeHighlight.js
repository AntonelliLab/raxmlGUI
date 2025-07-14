import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import Prism from 'prismjs';
import 'prismjs-bibtex';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css'; // coy, dark, funky, okaidia, solarizedlight, tomorrow, twilight

function CodeHighlight({ code, language, className }) {
  const codeNode = useRef(null);

  useEffect(() => {
    if (Prism.languages.hasOwnProperty(language)) {
      const highlightHTML = Prism.highlight(code, Prism.languages[language], language);
      codeNode.current.innerHTML = highlightHTML;
    }
  }, [code, language]);

  return (
    <Box component="pre" className={className}>
      <Box
        component="code"
        ref={codeNode}
        sx={{
          fontSize: 10,
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        { code }
      </Box>
    </Box>
  );
}

CodeHighlight.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default CodeHighlight;
