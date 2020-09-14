import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import classNames from 'classnames';
import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';

// const useStyles = makeStyles(theme => ({
const useStyles = makeStyles((theme) => {
  return {
    PartitionFileCard: {
      backgroundColor: theme.palette.input.light,
      border: `1px solid ${theme.palette.input.border}`,
      height: '200px',
      display: 'flex',
      flexDirection: 'column',
    },
    chip: {
      height: '30px',
      color: theme.palette.input.contrastText,
      backgroundColor: theme.palette.input.main,
      border: `1px solid ${theme.palette.input.darker}`,
    },
    deleteChip: {
      backgroundColor: 'transparent',
      border: 'none',
      marginRight: -5,
    },
    deleteChipIcon: {
      opacity: 1,
    },
    partitionFileContainer: {
      overflowY: 'auto',
      height: '150px',
    },
    partitionFileContent: {
      color: theme.palette.primary.contrastText,
      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontSize: '12px',
      height: '100%',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    path: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
      marginLeft: 4,
    },
  };
});


function PartitionFileCard({ className, run }) {
  const classes = useStyles();

  if (!run.havePartitionFile) {
    return null;
  }

  return (
    <Card className={classNames(className, classes.PartitionFileCard)}>
      <CardHeader
        avatar={
          <Chip
            className={classes.chip}
            label="Partition"
            color="secondary"
          />
        }
        action={
          <div>
            <Chip
              classes={{
                root: classes.deleteChip,
                deleteIcon: classes.deleteChipIcon,
              }}
              deleteIcon={<DeleteForeverIcon />}
              onDelete={run.removePartitionFile}
              title="Remove partition"
            />
          </div>
        }
        title={run.partitionFileName}
        style={{ paddingBottom: 4 }}
      />
      <CardContent style={{ flexGrow: 1, paddingTop: 5, paddingBottom: 5 }}>
        <div className={classes.partitionFileContainer}>
          <code className={classes.partitionFileContent}>
            { run.partitionFileContent }
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

PartitionFileCard.propTypes = {
  run: PropTypes.object.isRequired,
  className: PropTypes.string,
};

const PartitionFileCardObserver = observer(PartitionFileCard);

export default PartitionFileCardObserver;
