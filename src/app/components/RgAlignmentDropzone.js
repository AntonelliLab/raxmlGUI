// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';

import * as actions from '../actions';

import './RgAlignmentDropzone.css';

type Props = {
  small: boolean,
  loadAlignmentFiles: () => void,
  addAlignments: () => void,
  history: {
    push: () => void
  }
};

/**
 * Component to show a {@link Dropzone} that handles the input of alignment files.
 * With an open file viewer window, the user can drag and drop alignment files here, but also click
 * the view to open a file browser. Incoming files are screened via extension.
 * Cuurently we accept files with standard fasta extensions only.
 */
class RgAlignmentDropzone extends Component<Props> {
  props: Props;

  state = {
    hovering: false
  };

  onDrop = (acceptedFiles, rejectedFiles) => {
    // Invalid file types are not added to files object
    // Get info of the files
    const alignments = _.map(acceptedFiles, ({ name, path, type }) => ({
      name,
      path,
      type
    }));
    // If we have files to add
    if (alignments.length) {
      this.props.addAlignments(alignments);
      // If the dropzone window is large, i.e. as in Alignment select screen go to convert screen
      if (!this.props.small) {
        this.props.history.push('/convert');
      }
    } else {
      // Drop was called, but no files remain after filter for file extension
      alert('Currently, we accept fasta files only!');
    }
  };

  onClick = (event) => {
    this.props.loadAlignmentFiles();
    if (!this.props.small) {
      this.props.history.push('/convert');
    }
  }

  render() {
    const baseStyle = { width: 200, height: 200, borderWidth: 2, borderColor: '#666', borderStyle: 'dashed', borderRadius: 5 };
    const activeStyle = { borderStyle: 'solid', borderColor: '#6c6', backgroundColor: '#eee' };
    const rejectStyle = { borderStyle: 'solid', borderColor: '#c66', backgroundColor: '#eee' };
    return (
      <div
        className={
          this.props.small ? 'RgAlignmentDropzone-small' : 'RgAlignmentDropzone'
        }
      >
      <Dropzone
        onDrop={this.onDrop}
        onClick={(event) => this.onClick(event)}
        multiple
        accept=".fas, .fasta, .fna, .ffn, .faa, .frn, .txt"
      >
        {({getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject}) => {
          let styles = { ...baseStyle };
          styles = isDragActive ? { ...styles, ...activeStyle } : styles;
          styles = isDragReject ? { ...styles, ...rejectStyle } : styles;
          return (
            <div {...getRootProps()} style={styles}>
              <div>
                Drag and drop fasta files here, or click to select.
                <br/>
                <br/>
                At the moment you can only add fasta files that are
                correctly formatted. We have no checks if your file is
                safe. So no idea what happens for non-fasta files.
              </div>
            </div>
          );
        }}
      </Dropzone>
      </div>
    );
  }
}

export default connect(
  null,
  actions
)(RgAlignmentDropzone);
