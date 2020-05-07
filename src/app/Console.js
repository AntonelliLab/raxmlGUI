import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';


const styles = theme => ({
  Console: {
    color: theme.palette.console.contrastText,
    background: theme.palette.console.background,
    // flexGrow: 1,
    // padding: '0 4px',
    padding: '10px',
    width: '100%',
  },
  stdoutContainer: {
    overflowY: 'auto',
    height: '100%',
  },
  code: {
    color: theme.palette.console.contrastText,
    fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontSize: '12px',
    height: '100%',
    width: '100%',
    // overflowWrap: 'anywhere', // currently not available in Chrome
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }
});

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
    const { run, classes } = this.props;
    return (
      <div
        className={clsx(classes.Console, classes.stdoutContainer)}
        ref={this.onMountStdoutContainer}
      >
        <div>
          <code className={classes.code}>{run.command}</code>
        </div>
        <div>
          <code className={classes.code}>{run.stdout}</code>
        </div>
      </div>
    );
  }
}

Console.propTypes = {
  run: PropTypes.object.isRequired
};

export default withStyles(styles)(Console);
