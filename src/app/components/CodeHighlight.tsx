import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import Prism from 'prismjs';
import type { Grammar } from 'prismjs';
import 'prismjs-bibtex';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css'; // coy, dark, funky, okaidia, solarizedlight, tomorrow, twilight

export interface CodeHighlightProps {
  code: string;
  language: string;
  sx?: SxProps<Theme>;
}

function CodeHighlight({ code, language, sx }: CodeHighlightProps) {
  const codeNode = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = codeNode.current;
    if (!el) {
      return;
    }
    const grammar = Prism.languages[language];
    if (grammar && typeof grammar === 'object') {
      el.innerHTML = Prism.highlight(code, grammar as Grammar, language);
    }
  }, [code, language]);

  return (
    <Box component="pre" sx={sx}>
      <Box
        component="code"
        ref={codeNode}
        sx={{
          fontSize: 10,
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {code}
      </Box>
    </Box>
  );
}

export default CodeHighlight;
