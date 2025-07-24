import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

@observer
class Console extends React.Component {
  keepToBottom = true;

  onMountStdoutContainer = el => {
    this.stdoutContainer = el;
  };

  componentDidUpdate() {
    if (this.keepToBottom) {
      this.scrollConsoleToBottom();
    }
  }

  isAtBottom = () => {
    const { scrollTop, scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    const scrollIsAtBottom = scrollTop === diff;
    return scrollIsAtBottom;
  };

  scrollConsoleToBottom = () => {
    const { scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    this.stdoutContainer.scrollTop = diff;
  };

  render() {
    const { run } = this.props;
    return (
      <Box
        ref={this.onMountStdoutContainer}
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
  }
}

Console.propTypes = {
  run: PropTypes.object.isRequired
};

export default Console;
