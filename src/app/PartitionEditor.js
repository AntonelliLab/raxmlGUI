import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import OptionTextField from './components/OptionTextField';
import OptionSelect from './components/OptionSelect';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

const useStyles = makeStyles(theme => ({
  Partition: {
    backgroundColor: theme.palette.input.background,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  formControl: {
    marginLeft: 5,
    marginRight: 10
  },
  content: {
    padding: 0
  },
  textField: {
    // height: 80,
    width: 250,
    padding: 0,
    marginTop: 10,
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  type: {
    width: 100,
  },
  aaType: {
    width: 120,
  },
  name: {
    width: 200,
  },
  start: {
    width: 70,
  },
  end: {
    width: 70,
  },
  codon: {
    width: 200,
  },
}));

function PartitionEditor({ alignment }) {
  const classes = useStyles();

  function handleAdd(event) {
    alignment.partition.addPart();
  }

  if (!alignment.showPartition) {
    return null;
  }

  const { partition } = alignment;
  const { partToAdd } = partition;

  return (
    (<Box p={4} pt={2} className={classes.Partition}>
      <Typography variant="h6">Partition editor</Typography>
      <Box mb={2} sx={{ width: '100%' }}>
        <LinearProgress variant="determinate" color="primary" value={partition.progress} />
        <Box display="flex" justifyContent="space-between" sx={{ marginTop: 2 }}>
          <small style={{ color: '#999' }}>{alignment.filename}: {alignment.numSequences} sequences of length {alignment.length}</small>
          <small style={{ color: '#999', marginLeft: 10 }}>Partition coverage: {partition.currentEndValue} / {partition.maxEndValue}</small>
        </Box>
      </Box>
      <Box>
        <Grid container spacing={1} alignItems="flex-end">
          <Grid>
            <OptionSelect option={partToAdd.type} className={classes.type} />
          </Grid>
          <Grid>
            <OptionSelect option={partToAdd.aaType} className={classes.aaType} />
          </Grid>
          <Grid>
            <OptionTextField option={partToAdd.name} className={classes.name} />
          </Grid>
          <Grid>
            <OptionTextField option={partToAdd.start} className={classes.start} />
          </Grid>
          <Grid>
            <OptionTextField option={partToAdd.end} className={classes.end} />
          </Grid>
          <Grid>
            <OptionSelect option={partToAdd.codon} className={classes.codon} />
          </Grid>
          <Grid>
            <Button variant="outlined" disabled={partition.addPartDisabled} onClick={handleAdd}>Add</Button>
          </Grid>
        </Grid>
        <Box mt={1} display="flex" justifyContent="flex-end">
          <Typography variant="caption" color="error">{partition.errorMessage || ' '}</Typography>
        </Box>
      </Box>
      <Box mt={2} sx={{ width: '100%' }}>
        <form className={classes.form} noValidate autoComplete="off">
          <TextField
            className="pre"
            style={{ width: '100%' }}
            id="partition"
            label="Partition"
            disabled={partition.isDefault}
            multiline
            rows="6"
            value={partition.text}
            onChange={() => {}}
            margin="normal"
            helperText={alignment.partitionHelperText || ''}
            variant="outlined"
            slotProps={{
              input: {
                classes: {
                  input: 'pre',
                }
              }
            }}
          />
        </form>
      </Box>
      <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
        { partition.isDefault ? null : (
          <Grid>
            <Button variant="outlined" title="Clear partition entries" onClick={partition.reset}>Reset</Button>
          </Grid>
        )}
        <Grid>
          <Button variant="outlined" onClick={alignment.hidePartition}>Back</Button>
        </Grid>
      </Grid>
    </Box>)
  );
}

PartitionEditor.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string
};

const PartitionEditorObserver = observer(PartitionEditor);

const useStylesOnCard = makeStyles(theme => ({
  partition: {
    padding: 0,
    marginTop: -30,
    backgroundColor: 'rgba(0,0,0,0)', // transparent background
    display: 'flex',
    alignItems: 'flex-start'
  },
  content: {
    padding: 0
  },
  form: {},
  textField: {
    width: 250,
    padding: 0,
    marginTop: 10,
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  }
}));
function PartitionOnCard({ alignment }) {
  const classes = useStylesOnCard();
  // const [partitionText, setPartitionText] = React.useState(alignment.partitionText);
  const [partitionText, setPartitionText] = React.useState(
    alignment.partitionFileContent
  );

  function handleChange(event) {
    setPartitionText(event.target.value);
  }

  function onClickCancel(event) {
    alignment.setShowPartition(false);
  }

  function onClickSave(event) {
    alignment.setPartitionText(partitionText);
    alignment.setShowPartition(false);
  }

  const hasChange = partitionText !== alignment.partitionText;

  return (
    <Card className={classes.partition} elevation={0}>
      <CardContent className={classes.content}>
        <form className={classes.form} noValidate autoComplete="off">
          <TextField
            id="partition"
            label="Partition"
            multiline
            rows="3"
            value={partitionText}
            onChange={handleChange}
            className={classes.textField}
            margin="normal"
            helperText={alignment.partitionHelperText || ''}
            variant="outlined"
          />
        </form>
      </CardContent>
      <CardActions>
        <Button aria-label="Cancel" variant="outlined" onClick={onClickCancel}>
          Cancel
        </Button>
        <Button
          aria-label="Save"
          variant="contained"
          color="secondary"
          disabled={!hasChange}
          onClick={onClickSave}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  );
}

PartitionOnCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string
};

const PartitionOnCardObserver = observer(PartitionOnCard);

export {
  PartitionEditorObserver as default,
  PartitionOnCardObserver as PartitionOnCard
};
