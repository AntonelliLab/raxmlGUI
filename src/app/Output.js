import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Link, Typography } from '@mui/material';
import FileIcon from '@mui/icons-material/InsertDriveFileSharp';
import { join } from 'path';

const useStyles = makeStyles((theme) => ({
  Output: {
    width: '100%',
    padding: '10px',
  },
  form: {
    width: '100%',
    '& > *:not(:first-child)': {
      marginTop: theme.spacing(3),
    },
  },
  formItem: {},
  result: {
    // maxHeight: 200,
    // overflowY: 'auto',
  },
}));

const Output = ({ run }) => {

  const classes = useStyles();

  const { resultFilenames } = run;
  const haveResult = resultFilenames.length > 0;

  return (
    (<div className={classes.Output}>
      <Box component="form" mt={1} mb={2} display="flex" flexDirection="column" className={classes.form} noValidate autoComplete="off">
        <TextField
          variant="standard"
          id="output-dir"
          helperText="Select output directory"
          fullWidth
          className={classes.formItem}
          value={run.outputDir}
          onClick={run.selectOutputDir}
          slotProps={{
            input: {
              readOnly: true,
            }
          }} />
        <TextField
          variant="standard"
          id="output-name"
          helperText={run.outputNameNotice || "Select output name"}
          className={classes.formItem}
          value={run.outputName}
          placeholder={run.outputNamePlaceholder}
          onChange={e => run.setOutputName(e.target.value)}
          error={!run.outputNameOk} />
      </Box>
      <Box mt={1} display="flex" flexDirection="column" alignItems="stretch" className={classes.result}>
      { haveResult ? <Typography>Result for output id '{run.outputName}' </Typography> : null }
      { resultFilenames.map(filename =>
        <Link
          key={filename}
          sx={{
            color: (theme) => theme.palette.primary.contrastText,
            display: 'flex',
            alignItems: 'flex-end',
            cursor: 'pointer',
          }}
          onClick={() => run.openFile(join(run.outputDir, filename))}
          underline="hover">
          <FileIcon/>
          <Box
            component="span"
            sx={{
              color: (theme) => theme.palette.primary.contrastText,
            }}
          >
            {filename}
          </Box>
        </Link>
      )}
      </Box>
      { run.haveAlignments || haveResult ? (
        <Box component="form" my={1}>
          <Button onClick={run.openOutputDir} variant="outlined">Open folder</Button>
        </Box>
      ) : null }
    </div>)
  );
};

Output.propTypes = {
  run: PropTypes.object.isRequired,
};

export default observer(Output);
