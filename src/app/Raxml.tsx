import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import OptionSelect from './components/OptionSelect';
import type { OptionSelectOptionLike } from './components/OptionSelect';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { FormHelperText } from '@mui/material';

interface RaxmlRun {
  command: string;
  binary: OptionSelectOptionLike;
  numThreads: OptionSelectOptionLike;
  modelTestIsRunningOnAlignment: boolean;
  cancelModeltestOnAlignment: () => void;
  running: boolean;
  cancel: () => void;
  startDisabled: boolean;
  start: () => void;
}

interface RaxmlStore {
  setAppSnack: () => void;
}

export interface RaxmlProps {
  run: RaxmlRun;
  store: RaxmlStore;
}

const Raxml = ( { run, store }: RaxmlProps ): React.JSX.Element => {
  const copyCommand = useCallback( async () => {
    const { rendererBridge } = window;
    await rendererBridge.copyText( run.command );
    store.setAppSnack();
  }, [run.command, store] );

  return (
    <Box
      sx={{
        padding: '10px',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <Box
        component="form"
        mt={1}
        mb={2}
        display="flex"
        noValidate
        autoComplete="off"
        alignItems="center"
        sx={{
          gap: '20px',
        }}
      >
        <OptionSelect option={run.binary} />
        <OptionSelect option={run.numThreads} />
        {run.modelTestIsRunningOnAlignment
          ? (
            <Button
              size="small"
              variant="outlined"
              onClick={run.cancelModeltestOnAlignment}
            >
            Cancel modeltest
            </Button>
          )
          : null}
        {run.running
          ? (
            <Button variant="outlined" onClick={run.cancel}>
            Cancel
            </Button>
          )
          : null}
        <Button
          data-testid="run-analysis"
          variant="contained"
          color="secondary"
          loading={run.running}
          loadingPosition="end"
          disabled={run.startDisabled}
          onClick={run.start}
        >
          Run
        </Button>
      </Box>

      <Box paddingBottom={1}>
        <Box display="flex">
          <Tooltip aria-label="copy-command" title="Copy command">
            <IconButton
              style={{ position: 'absolute', right: 0 }}
              onClick={copyCommand}
              size="large"
            >
              <FileCopyIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body1">{run.command}</Typography>
        </Box>
        <FormHelperText>Command</FormHelperText>
      </Box>
    </Box>
  );
};

export default observer( Raxml );
