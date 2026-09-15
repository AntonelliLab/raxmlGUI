import React from 'react';
import { observer } from 'mobx-react-lite';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import AlignmentCard, { FinalAlignmentCard } from './AlignmentCard';
import AstralTreeCard from './AstralTreeCard';
import PartitionFileCard from './PartitionFileCard';
import Box from '@mui/material/Box';
import TreeCard from './TreeCard';
import { Typography } from '@mui/material';
import Dropzone from 'react-dropzone';
import { webUtils } from 'electron';

const Input = ({ run }) => {
  // run.hasAstralTree is the condition on which to show an astral tree card
  // For some reason when changed in the mobx store a rerender is not triggered with this boolean with the conditional below alone
  // With this if the component rerenders as should be
  if (run.hasAstralTree) {
    console.log('run.hasAstralTree :>> ', run.hasAstralTree);
  }

  const onAlignmentDrop = (acceptedFiles) => {
    const droppedPathes = acceptedFiles.map((file) => ({
      path: webUtils.getPathForFile(file),
    }));
    run.addAlignments(droppedPathes);
  };

  const onPartitionDrop = (acceptedFiles) => {
    const droppedPathes = acceptedFiles.map((file) => ({
      path: webUtils.getPathForFile(file),
    }));
    run.addPartitionFiles(droppedPathes);
  };

  const onTreeDrop = (type) => (acceptedFiles) => {
    const droppedPathes = acceptedFiles.map((file) => ({
      path: webUtils.getPathForFile(file),
    }));
    run.addTreeFiles(type, droppedPathes);
  };

  const onAstralTreeDrop = (acceptedFiles) => {
    const droppedPathes = acceptedFiles.map((file) => ({
      path: webUtils.getPathForFile(file),
    }));
    if (droppedPathes.length) {
      run.addAstralFiles(droppedPathes[0]);
    }
  };

  const dropzoneRootSx = (isDragActive, extra = {}) => ({
    width: 'fit-content',
    alignSelf: 'flex-start',
    borderRadius: 1,
    border: (theme) =>
      isDragActive
        ? `2px dashed ${theme.palette.input.darker}`
        : '2px dashed transparent',
    bgcolor: (theme) =>
      isDragActive ? theme.palette.input.lighter : 'transparent',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    ...extra,
  });

  // const SelectNumRuns = run.
  return (
    <Box display="flex" flexDirection="column" sx={{ width: '100%' }}>
      <Box
        display="flex"
        mb={1}
        alignItems="center"
        sx={{
          width: '100%',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          padding: '10px',
        }}
      >
        <Dropzone noClick onDrop={onAlignmentDrop}>
          {({ getRootProps, getInputProps, isDragActive }) => (
            <Box {...getRootProps()} sx={dropzoneRootSx(isDragActive)}>
              <input {...getInputProps()} style={{ display: 'none' }} />
              <Box display="flex" alignItems="center" sx={{ gap: '10px' }}>
                {run.inputIsAlignment
                  ? run.alignments.map((alignment) => (
                      <AlignmentCard
                        key={alignment.path}
                        alignment={alignment}
                      />
                    ))
                  : null}
                {run.inputIsTree && run.hasAstralTree ? (
                  <AstralTreeCard astralTree={run.astralTree} />
                ) : null}
                {run.canLoadAlignment &&
                !run.haveAlignments &&
                !run.canLoadPartitionFile ? (
                  <Button
                    variant="outlined"
                    sx={{
                      width: '550px',
                      height: '200px',
                    }}
                    onClick={run.loadAlignmentFiles}
                  >
                    Load alignment
                  </Button>
                ) : null}
              </Box>
            </Box>
          )}
        </Dropzone>

        <Box paddingX={1}>
          <PartitionFileCard run={run} />
        </Box>
        {run.canLoadAstralTree ? (
          <Dropzone noClick onDrop={onAstralTreeDrop}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <Box
                {...getRootProps()}
                sx={dropzoneRootSx(isDragActive, {
                  width: '200px',
                  height: '200px',
                })}
              >
                <input {...getInputProps()} style={{ display: 'none' }} />
                <Button
                  variant="outlined"
                  sx={{
                    width: '100%',
                    height: '100%',
                  }}
                  onClick={run.loadAstralTree}
                >
                  Load input trees
                </Button>
              </Box>
            )}
          </Dropzone>
        ) : null}
        {run.canLoadAlignment &&
        !run.canLoadPartitionFile &&
        run.haveAlignments ? (
          <Dropzone noClick onDrop={onAlignmentDrop}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <Box
                {...getRootProps()}
                sx={dropzoneRootSx(isDragActive, { flexShrink: 0 })}
              >
                <input {...getInputProps()} style={{ display: 'none' }} />
                <Button
                  variant="outlined"
                  sx={{
                    width: '200px',
                    minWidth: '200px',
                    height: '200px',
                  }}
                  onClick={run.loadAlignmentFiles}
                  title="Concatenate new alignments and create partition"
                >
                  Add alignment
                </Button>
              </Box>
            )}
          </Dropzone>
        ) : null}

        {run.canLoadAlignment && run.canLoadPartitionFile ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            style={{ height: '200px' }}
          >
            <Dropzone noClick onDrop={onAlignmentDrop}>
              {({ getRootProps, getInputProps, isDragActive }) => (
                <Box
                  {...getRootProps()}
                  sx={dropzoneRootSx(isDragActive, {
                    flexGrow: 1,
                    width: '100%',
                    minWidth: '200px',
                  })}
                >
                  <input {...getInputProps()} style={{ display: 'none' }} />
                  <Button
                    variant="outlined"
                    sx={{
                      minWidth: '200px',
                      width: '100%',
                      height: '100%',
                      flexGrow: 1,
                    }}
                    onClick={run.loadAlignmentFiles}
                    title="Concatenate new alignments and automatically generate a partition"
                  >
                    Add alignment
                  </Button>
                </Box>
              )}
            </Dropzone>
            <Box paddingX={2}>OR</Box>
            <Dropzone noClick onDrop={onPartitionDrop}>
              {({ getRootProps, getInputProps, isDragActive }) => (
                <Box
                  {...getRootProps()}
                  sx={dropzoneRootSx(isDragActive, {
                    flexGrow: 1,
                    width: '100%',
                    minWidth: '200px',
                  })}
                >
                  <input {...getInputProps()} style={{ display: 'none' }} />
                  <Button
                    variant="outlined"
                    sx={{
                      minWidth: '200px',
                      width: '100%',
                      height: '100%',
                      flexGrow: 1,
                    }}
                    onClick={run.loadPartitionFile}
                    title="Load a partition file for the current alignment"
                  >
                    Load partition
                  </Button>
                </Box>
              )}
            </Dropzone>
          </Box>
        ) : null}
        <Box>
          <div style={{ width: 20, height: 200 }}></div>
        </Box>
      </Box>

      {run.tree.notAvailable ? null : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            padding: '10px',
          }}
        >
          <Box sx={{ display: 'flex' }}>
            {run.tree.haveFile ? (
              <TreeCard
                tree={run.tree}
                sx={{
                  width: '380px',
                  height: '100px',
                }}
              />
            ) : (
              <Dropzone noClick onDrop={onTreeDrop('tree')}>
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <Box
                    {...getRootProps()}
                    sx={dropzoneRootSx(isDragActive, {
                      width: '380px',
                      height: '100px',
                    })}
                  >
                    <input {...getInputProps()} style={{ display: 'none' }} />
                    <Button
                      variant="outlined"
                      sx={{
                        width: '100%',
                        height: '100%',
                      }}
                      onClick={run.loadTreeFile}
                    >
                      Add Tree
                    </Button>
                  </Box>
                )}
              </Dropzone>
            )}
          </Box>
        </Box>
      )}
      {run.backboneConstraint.notAvailable ? null : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            padding: '10px',
          }}
        >
          <Box sx={{ display: 'flex' }}>
            {run.backboneConstraint.haveFile ? (
              <TreeCard
                tree={run.backboneConstraint}
                sx={{
                  width: '380px',
                  height: '100px',
                }}
              />
            ) : (
              <Dropzone noClick onDrop={onTreeDrop('backboneConstraint')}>
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <Box
                    {...getRootProps()}
                    sx={dropzoneRootSx(isDragActive, {
                      width: '380px',
                      height: '100px',
                    })}
                  >
                    <input {...getInputProps()} style={{ display: 'none' }} />
                    <Button
                      variant="outlined"
                      sx={{
                        width: '100%',
                        height: '100%',
                      }}
                      onClick={run.loadBackboneConstraintFile}
                    >
                      Add Backbone Constraint
                    </Button>
                  </Box>
                )}
              </Dropzone>
            )}
          </Box>
        </Box>
      )}
      {run.multifurcatingConstraint.notAvailable ? null : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            padding: '10px',
          }}
        >
          <Box sx={{ display: 'flex' }}>
            {run.multifurcatingConstraint.haveFile ? (
              <TreeCard
                tree={run.multifurcatingConstraint}
                sx={{
                  width: '380px',
                  height: '100px',
                }}
              />
            ) : (
              <Dropzone noClick onDrop={onTreeDrop('multifurcatingConstraint')}>
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <Box
                    {...getRootProps()}
                    sx={dropzoneRootSx(isDragActive, {
                      width: '380px',
                      height: '100px',
                    })}
                  >
                    <input {...getInputProps()} style={{ display: 'none' }} />
                    <Button
                      variant="outlined"
                      sx={{
                        width: '100%',
                        height: '100%',
                      }}
                      onClick={run.loadMultifurcatingConstraintFile}
                    >
                      Add Multifurcating Constraint
                    </Button>
                  </Box>
                )}
              </Dropzone>
            )}
          </Box>
        </Box>
      )}

      {run.alignments.length <= 1 ? null : (
        <Box sx={{ padding: '10px' }}>
          <Typography variant="h5">Concatenated alignment</Typography>
          <FinalAlignmentCard
            alignment={run.finalAlignment}
            sx={{
              width: '550px',
              height: '200px',
            }}
          />
        </Box>
      )}
    </Box>
  );
};

Input.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Input);
