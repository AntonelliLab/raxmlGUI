import React, { useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';

interface ConsoleRun {
  stdout: string;
  stderr: string;
}

export interface ConsoleProps {
  run: ConsoleRun;
}

const Console = ( { run }: ConsoleProps ): React.JSX.Element => {
  const stdoutContainerRef = useRef<HTMLDivElement | null>( null );

  const scrollConsoleToBottom = useCallback( () => {
    if ( !stdoutContainerRef.current ) return;
    const { scrollHeight, clientHeight } = stdoutContainerRef.current;
    const diff = scrollHeight - clientHeight;
    stdoutContainerRef.current.scrollTop = diff;
  }, [] );

  // Every time the component updates, scroll to the bottom
  useEffect( () => {
    scrollConsoleToBottom();
  } );

  return (
    <Box
      data-testid="console-output"
      ref={stdoutContainerRef}
      sx={{
        color: ( theme ) => theme.palette.console.contrastText,
        background: ( theme ) => theme.palette.console.background,
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
              color: ( theme ) => theme.palette.console.contrastText,
              fontFamily:
                'Consolas, "Liberation Mono", Menlo, Courier, monospace',
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
              color: ( theme ) => theme.palette.console.contrastText,
              fontFamily:
                'Consolas, "Liberation Mono", Menlo, Courier, monospace',
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

export default observer( Console );
