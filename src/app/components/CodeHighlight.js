import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Prism from 'prismjs';
import 'prismjs-bibtex';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css'; // coy, dark, funky, okaidia, solarizedlight, tomorrow, twilight


function CodeHighlight({ code, language, className }) {
  const codeNode = useRef(null);

  useEffect(() => {
    // const code = codeNode.current.textContent;
    const highlightHTML = Prism.highlight(code, Prism.languages[language], language);
    codeNode.current.innerHTML = highlightHTML;
  }, [code, language]);

  return (
    <pre>
      <code ref={codeNode} className={className}>
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
