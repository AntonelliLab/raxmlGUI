import React, { useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

const Console = ({ run }) => {
  const stdoutContainerRef = useRef(null);

  const scrollConsoleToBottom = useCallback(() => {
    if (!stdoutContainerRef.current) return;
    const { scrollHeight, clientHeight } = stdoutContainerRef.current;
    const diff = scrollHeight - clientHeight;
    stdoutContainerRef.current.scrollTop = diff;
  }, []);

  useEffect(() => {
    scrollConsoleToBottom();
  });

  return (
    <Box
      ref={stdoutContainerRef}
      sx={{
        color: (theme) => theme.palette.console.contrastText,
        background: (theme) => theme.palette.console.background,
        padding: '10px',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div>
        {run.stdout && (
          <Box
            component="code"
            sx={{
              color: (theme) => theme.palette.console.contrastText,
              fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
              fontSize: '12px',
              height: '100%',
              position: 'absolute',
              width: '100%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {run.stdout}
          </Box>
        )}
        {run.stderr && (
          <Box
            component="code"
            sx={{
              color: (theme) => theme.palette.console.contrastText,
              fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
              fontSize: '12px',
              height: '100%',
              position: 'absolute',
              width: '100%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {run.stderr}
          </Box>
        )}
      </div>
    </Box>
  );
};

Console.propTypes = {
  run: PropTypes.object.isRequired
};

export default observer(Console);
