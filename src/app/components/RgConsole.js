// @flow
import React, { Component } from 'react';
import type { Run } from '../reducers/types';

import './RgConsole.css';

type Props = {
  run: Run
};

class RgConsole extends Component<Props> {
  props: Props;

  state = {
    stdout: ''
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { run } = nextProps;
    if (run) {
      return { stdout: prevState.stdout + String(run.data) };
    }
    // Return null to indicate no change to state.
    return null;
  }

  onMountStdoutContainer = el => {
    this.stdoutContainer = el;
  };

  // TODO: put this back in working, currntly the scroll container is not scrollable
  printToConsole = content => {
    if (!this.stdoutContainer) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    const scrollIsAtBottom = scrollTop === diff;
    if (scrollIsAtBottom) {
      this.scrollConsoleToBottom();
    }
  };

  scrollConsoleToBottom = () => {
    const { scrollHeight, clientHeight } = this.stdoutContainer;
    const diff = scrollHeight - clientHeight;
    this.stdoutContainer.scrollTop = diff;
  };

  render() {
    return (
      <div className="RgConsole">
        <div className="stdoutContainer" ref={this.onMountStdoutContainer}>
          <pre className="stdout">{this.state.stdout}</pre>
        </div>
      </div>
    );
  }
}

export default RgConsole;
