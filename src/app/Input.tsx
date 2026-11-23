import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import AlignmentCard, { FinalAlignmentCard } from './AlignmentCard';
import type { AlignmentCardProps, FinalAlignmentCardProps } from './AlignmentCard';
import AstralTreeCard from './AstralTreeCard';
import type { AstralTreeCardProps } from './AstralTreeCard';
import PartitionFileCard from './PartitionFileCard';
import type { PartitionFileCardProps } from './PartitionFileCard';
import Box from '@mui/material/Box';
import TreeCard from './TreeCard';
import type { TreeCardProps } from './TreeCard';
import { Typography } from '@mui/material';
import Dropzone from 'react-dropzone';
import type { SxProps, Theme } from '@mui/material/styles';

interface DroppedFile {
  path: string;
}

// Each child card's props name what it reads of the same store object.
type InputTree = TreeCardProps['tree'] & {
  notAvailable: boolean;
  haveFile: boolean;
};

type InputRun = PartitionFileCardProps['run'] & {
  hasAstralTree: boolean;
  addAlignments: ( files: DroppedFile[] ) => void;
  addPartitionFiles: ( files: DroppedFile[] ) => void;
  addTreeFiles: ( type: string, files: DroppedFile[] ) => void;
  addAstralFiles: ( file: DroppedFile ) => void;
  inputIsAlignment: boolean;
  alignments: ( AlignmentCardProps['alignment'] & { path: string } )[];
  inputIsTree: boolean;
  astralTree: AstralTreeCardProps['astralTree'];
  canLoadAlignment: boolean;
  haveAlignments: boolean;
  canLoadPartitionFile: boolean;
  loadAlignmentFiles: () => void;
  canLoadAstralTree: boolean;
  loadAstralTree: () => void;
  loadPartitionFile: () => void;
  tree: InputTree;
  loadTreeFile: () => void;
  backboneConstraint: InputTree;
  loadBackboneConstraintFile: () => void;
  multifurcatingConstraint: InputTree;
  loadMultifurcatingConstraintFile: () => void;
  finalAlignment: FinalAlignmentCardProps['alignment'];
};

export interface InputProps {
  run: InputRun;
}

function droppedPath( file: File ): string {
  const { rendererBridge } = window;
  return rendererBridge.getPathForFile( file );
}

const Input = ( { run }: InputProps ): React.JSX.Element => {
  // run.hasAstralTree is the condition on which to show an astral tree card
  // For some reason when changed in the mobx store a rerender is not triggered with this boolean with the conditional below alone
  // With this if the component rerenders as should be
  if ( run.hasAstralTree ) {
    console.log( 'run.hasAstralTree :>> ', run.hasAstralTree );
  }

  const onAlignmentDrop = ( acceptedFiles: File[] ) => {
    const droppedPathes = acceptedFiles.map( ( file ) => ( {
      path: droppedPath( file ),
    } ) );
    run.addAlignments( droppedPathes );
  };

  const onPartitionDrop = ( acceptedFiles: File[] ) => {
    const droppedPathes = acceptedFiles.map( ( file ) => ( {
      path: droppedPath( file ),
    } ) );
    run.addPartitionFiles( droppedPathes );
  };

  const onTreeDrop = ( type: string ) => ( acceptedFiles: File[] ) => {
    const droppedPathes = acceptedFiles.map( ( file ) => ( {
      path: droppedPath( file ),
    } ) );
    run.addTreeFiles( type, droppedPathes );
  };

  const onAstralTreeDrop = ( acceptedFiles: File[] ) => {
    const droppedPathes = acceptedFiles.map( ( file ) => ( {
      path: droppedPath( file ),
    } ) );
    if ( droppedPathes.length ) {
      run.addAstralFiles( droppedPathes[0] );
    }
  };

  const dropzoneRootSx = (
    isDragActive: boolean,
    extra: Record<string, string | number> = {},
  ): SxProps<Theme> => ( {
    width: 'fit-content',
    alignSelf: 'flex-start',
    borderRadius: 1,
    border: ( theme: Theme ) =>
      isDragActive
        ? `2px dashed ${theme.palette.input.darker}`
        : '2px dashed transparent',
    bgcolor: ( theme: Theme ) =>
      isDragActive
        ? theme.palette.input.lighter
        : 'transparent',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    ...extra,
  } );

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
          {( { getRootProps, getInputProps, isDragActive } ) => (
            <Box {...getRootProps()} sx={dropzoneRootSx( isDragActive )}>
              <input {...getInputProps()} style={{ display: 'none' }} />
              <Box display="flex" alignItems="center" sx={{ gap: '10px' }}>
                {run.inputIsAlignment
                  ? run.alignments.map( ( alignment ) => (
                    <AlignmentCard
                      key={alignment.path}
                      alignment={alignment}
                    />
                  ) )
                  : null}
                {run.inputIsTree && run.hasAstralTree
                  ? (
                    <AstralTreeCard astralTree={run.astralTree} />
                  )
                  : null}
                {run.canLoadAlignment &&
                !run.haveAlignments &&
                !run.canLoadPartitionFile
                  ? (
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
                  )
                  : null}
              </Box>
            </Box>
          )}
        </Dropzone>

        <Box paddingX={1}>
          <PartitionFileCard run={run} />
        </Box>
        {run.canLoadAstralTree
          ? (
            <Dropzone noClick onDrop={onAstralTreeDrop}>
              {( { getRootProps, getInputProps, isDragActive } ) => (
                <Box
                  {...getRootProps()}
                  sx={dropzoneRootSx( isDragActive, {
                    width: '200px',
                    height: '200px',
                  } )}
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
          )
          : null}
        {run.canLoadAlignment &&
        !run.canLoadPartitionFile &&
        run.haveAlignments
          ? (
            <Dropzone noClick onDrop={onAlignmentDrop}>
              {( { getRootProps, getInputProps, isDragActive } ) => (
                <Box
                  {...getRootProps()}
                  sx={dropzoneRootSx( isDragActive, { flexShrink: 0 } )}
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
          )
          : null}

        {run.canLoadAlignment && run.canLoadPartitionFile
          ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              style={{ height: '200px' }}
            >
              <Dropzone noClick onDrop={onAlignmentDrop}>
                {( { getRootProps, getInputProps, isDragActive } ) => (
                  <Box
                    {...getRootProps()}
                    sx={dropzoneRootSx( isDragActive, {
                      flexGrow: 1,
                      width: '100%',
                      minWidth: '200px',
                    } )}
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
                {( { getRootProps, getInputProps, isDragActive } ) => (
                  <Box
                    {...getRootProps()}
                    sx={dropzoneRootSx( isDragActive, {
                      flexGrow: 1,
                      width: '100%',
                      minWidth: '200px',
                    } )}
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
          )
          : null}
        <Box>
          <div style={{ width: 20, height: 200 }}></div>
        </Box>
      </Box>

      {run.tree.notAvailable
        ? null
        : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              padding: '10px',
            }}
          >
            <Box sx={{ display: 'flex' }}>
              {run.tree.haveFile
                ? (
                  <TreeCard
                    tree={run.tree}
                    sx={{
                      width: '380px',
                      height: '100px',
                    }}
                  />
                )
                : (
                  <Dropzone noClick onDrop={onTreeDrop( 'tree' )}>
                    {( { getRootProps, getInputProps, isDragActive } ) => (
                      <Box
                        {...getRootProps()}
                        sx={dropzoneRootSx( isDragActive, {
                          width: '380px',
                          height: '100px',
                        } )}
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
      {run.backboneConstraint.notAvailable
        ? null
        : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              padding: '10px',
            }}
          >
            <Box sx={{ display: 'flex' }}>
              {run.backboneConstraint.haveFile
                ? (
                  <TreeCard
                    tree={run.backboneConstraint}
                    sx={{
                      width: '380px',
                      height: '100px',
                    }}
                  />
                )
                : (
                  <Dropzone noClick onDrop={onTreeDrop( 'backboneConstraint' )}>
                    {( { getRootProps, getInputProps, isDragActive } ) => (
                      <Box
                        {...getRootProps()}
                        sx={dropzoneRootSx( isDragActive, {
                          width: '380px',
                          height: '100px',
                        } )}
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
      {run.multifurcatingConstraint.notAvailable
        ? null
        : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              padding: '10px',
            }}
          >
            <Box sx={{ display: 'flex' }}>
              {run.multifurcatingConstraint.haveFile
                ? (
                  <TreeCard
                    tree={run.multifurcatingConstraint}
                    sx={{
                      width: '380px',
                      height: '100px',
                    }}
                  />
                )
                : (
                  <Dropzone noClick onDrop={onTreeDrop( 'multifurcatingConstraint' )}>
                    {( { getRootProps, getInputProps, isDragActive } ) => (
                      <Box
                        {...getRootProps()}
                        sx={dropzoneRootSx( isDragActive, {
                          width: '380px',
                          height: '100px',
                        } )}
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

      {run.alignments.length <= 1
        ? null
        : (
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

export default observer( Input );
