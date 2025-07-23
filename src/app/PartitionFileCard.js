import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import classNames from 'classnames';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

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
          <code className={classes.partitionFileContent}>
        <Box
          sx={{
            overflowY: 'auto',
            height: '150px',
          }}
        >
            { run.partitionFileContent }
          </code>
        </Box>
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
