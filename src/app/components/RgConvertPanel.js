// @flow
import React, { Component } from 'react';
import _ from 'lodash';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import type { Alignment } from '../reducers/types';

import { removeAllAlignments, createRun } from '../actions';

import './RgConvertPanel.css';

type Props = {
  alignments: Array<Alignment>,
  history: {
    push: () => void
  },
  removeAllAlignments: () => void,
  createRun: () => void
};

class RgConvertPanel extends Component<Props> {
  props: Props;

  onCreateRunPressed = () => {
    const { alignments, history } = this.props;
    this.props.createRun(alignments);
    // TODO: this should await the successfull run creation
    // TODO: set up history in redux store, then dispatch routing from redux-thunk action in onCreated listener
    history.push('/run');
  };

  renderAlignmentInfo() {
    const { alignments } = this.props;
    const firstAlignment = alignments[0];
    if (!alignments || !firstAlignment) {
      return null;
    }
    const numberSequences = (firstAlignment.sequences || []).length;
    const numberSites = firstAlignment.length || 0;
    return (
      <Typography variant="body2" >
        #sequences: {numberSequences}; #sites: {numberSites}
      </Typography>
    );
  }

  render() {
    const { alignments } = this.props;
    return (
      <div className="convert-panel">
        {this.renderAlignmentInfo()}
        <Button
          className="button"
          variant="contained"
          color="primary"
          disabled={alignments.length === 0}
          onClick={this.onCreateRunPressed}
        >
          {alignments.length > 1 ? 'Combine alignments' : 'Analyse alignment'}
        </Button>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const alignments = _.map(state.alignments);
  return { alignments };
}

export default withRouter(
  connect(
    mapStateToProps,
    { removeAllAlignments, createRun }
  )(RgConvertPanel)
);
