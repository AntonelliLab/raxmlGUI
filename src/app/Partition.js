import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';

const useStyles = makeStyles(theme => ({
  partition: {
    padding: 0,
    marginTop: -40,
  },
  content: {
    padding: 0,
  },
  form: {
  },
  textField: {
    height: 80,
    padding: 0,
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },

}));

function Partition({ alignment }) {

  const classes = useStyles();
  const [partitionText, setPartitionText] = React.useState(alignment.partitionText);

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
            helperText={alignment.partitionHelperText || ""}
            variant="outlined"
          />
        </form>
      </CardContent>
      <CardActions>
        <Button aria-label="Cancel" variant="outlined" onClick={onClickCancel}>Cancel</Button>
        <Button aria-label="Save" variant="contained" disabled={!hasChange} onClick={onClickSave}>Save</Button>
      </CardActions>
    </Card>
  );
};


Partition.propTypes = {
  alignment: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default observer(Partition);
