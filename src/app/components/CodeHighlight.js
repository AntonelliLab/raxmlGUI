import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import 'prismjs-bibtex';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css'; // coy, dark, funky, okaidia, solarizedlight, tomorrow, twilight

const useStyles = makeStyles(() => ({
  code: {
    fontSize: 10,
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  }
}));

function CodeHighlight({ code, language, className }) {
  const codeNode = useRef(null);
  const classes = useStyles();

  useEffect(() => {
    // const code = codeNode.current.textContent;
    if (Prism.languages.hasOwnProperty(language)) {
      const highlightHTML = Prism.highlight(code, Prism.languages[language], language);
      codeNode.current.innerHTML = highlightHTML;
    }
  }, [code, language]);

  return (
    <pre className={className}>
      <code ref={codeNode} className={classes.code}>
        { code }
      </code>
    </pre>
  );
}

CodeHighlight.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default CodeHighlight;
