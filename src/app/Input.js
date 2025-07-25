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
  // const SelectNumRuns = run.
  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ width: '100%' }}
    >
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
        <Dropzone
          noClick
          onDrop={(acceptedFiles) => {
            const droppedPathes = acceptedFiles.map((file) => {
              return {
                path: webUtils.getPathForFile(file),
              };
            });
            run.addAlignments(droppedPathes);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps()}>
              <Box
                display="flex"
                alignItems="center"
                sx={{ gap: '10px' }}
              >
                {run.inputIsAlignment
                  ? run.alignments.map((alignment) => (
                      <AlignmentCard
                        key={alignment.path}
                        alignment={alignment}
                      />
                    ))
                  : null}
                {run.inputIsTree && run.hasAstralTree ? (
                  <AstralTreeCard
                    astralTree={run.astralTree}
                  />
                ) : null}
                <Box paddingX={1}>
                  <PartitionFileCard run={run} />
                </Box>
                {run.canLoadAstralTree ? (
                  <Button
                    variant="outlined"
                    sx={{
                      width: '200px',
                      height: '200px',
                    }}
                    onClick={run.loadAstralTree}
                  >
                    Load input trees
                  </Button>
                ) : null}
                {run.canLoadAlignment && !run.canLoadPartitionFile ? (
                  <Button
                    variant="outlined"
                    sx={{
                      width: '200px',
                      height: '200px',
                    }}
                    onClick={run.loadAlignmentFiles}
                    title={
                      run.haveAlignments
                        ? 'Concatenate new alignments and create partition'
                        : ''
                    }
                  >
                    {run.haveAlignments ? 'Add alignment' : 'Load alignment'}
                  </Button>
                ) : null}
              </Box>
            </div>
          )}
        </Dropzone>

        {run.canLoadAlignment && run.canLoadPartitionFile ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            style={{ height: '200px' }}
          >
            <Button
              variant="outlined"
              sx={{
                minWidth: '200px',
                flexGrow: 1,
              }}
              onClick={run.loadAlignmentFiles}
              title="Concatenate new alignments and automatically generate a partition"
            >
              Add alignment
            </Button>
            <Box paddingX={2}>OR</Box>
            <Button
              variant="outlined"
              sx={{
                minWidth: '200px',
                flexGrow: 1,
              }}
              onClick={run.loadPartitionFile}
              title="Load a partition file for the current alignment"
            >
              Load partition
            </Button>
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
              <Button
                variant="outlined"
                sx={{
                  width: '380px',
                  height: '100px',
                }}
                onClick={run.loadTreeFile}
              >
                Add Tree
              </Button>
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
              <Button
                variant="outlined"
                sx={{
                  width: '380px',
                  height: '100px',
                }}
                onClick={run.loadBackboneConstraintFile}
              >
                Add Backbone Constraint
              </Button>
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
              <Button
                variant="outlined"
                sx={{
                  width: '380px',
                  height: '100px',
                }}
                onClick={run.loadMultifurcatingConstraintFile}
              >
                Add Multifurcating Constraint
              </Button>
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
