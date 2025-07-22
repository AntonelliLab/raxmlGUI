import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import classNames from 'classnames';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import OptionSelect from './components/OptionSelect';
import OptionTextField from './components/OptionTextField';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const InputSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.input.secondaryText,
    '&.Mui-checked': {
      color: theme.palette.input.dark,
    },
    '&.Mui-checked + .Mui-track': {
      backgroundColor: theme.palette.input.dark,
    },
  },
  checked: {},
  track: {},
}))(Switch);

// const useStyles = makeStyles(theme => ({
const useStyles = makeStyles((theme) => {
  return {
    cardHeaderRoot: {
      overflow: "hidden"
    },
    cardHeaderContent: {
      overflow: "hidden"
    },
    heading: {
      display: 'flex',
      alignItems: 'center',
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '-10px',
    },
    name: {
      marginRight: theme.spacing(1),
    },
    link: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
    },
    divider: {
      margin: '0 4px',
    },
    fileInfo: {
      color: '#ccc',
      fontSize: '0.75em',
      marginTop: '0.25em',
      overflowWrap: 'break-word',
    },
    partitionFileContainer: {
      overflowY: 'auto',
      height: 50,
    },
    partitionFileContent: {
      color: theme.palette.primary.contrastText,
      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontSize: '10px',
      height: '100%',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    path: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
      marginLeft: 4,
    },
    button: {
      margin: theme.spacing(1),
    },
    primaryButton: {
      backgroundColor: theme.palette.input.main,
      border: `1px solid ${theme.palette.input.darker}`,
      color: theme.palette.input.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.input.main,
      },
    },
    rightIcon: {
      marginLeft: theme.spacing(1),
    },
    iconSmall: {
      fontSize: 20,
    },
    outputButton: {
      marginLeft: theme.spacing(1),
    },
    loading: {
      marginLeft: '10px',
    },
    remove: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'flex-end',
    },
    select: {
      marginLeft: '10px',
      minWidth: '150px',
    },
    selectWide: {
      marginLeft: '10px',
      minWidth: '200px',
    },
  };
});

function _ModelTestButton({ alignment }) {
  const classes = useStyles();
  if (!alignment.modelTestCanRun) {
    return null;
  }
  return (
    <Button
      style={{ marginLeft: 10 }}
      className={classes.primaryButton}
      variant="contained"
      loading={alignment.modeltestLoading}
      loadingPosition="end"
      onClick={alignment.runModelTest}
      disabled={alignment.modeltestDisabled}
    >
      Run ModelTest
    </Button>
  );
}
_ModelTestButton.propTypes = {
  alignment: PropTypes.object.isRequired,
};

const ModelTestButton = observer(_ModelTestButton);

function AlignmentCard({ alignment }) {
  const { dataType, numSequences, length } = alignment;

  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleMenuClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function closeMenuAndRun(callback) {
    return () => {
      callback();
      setAnchorEl(null);
    };
  }

  const Size = alignment.parsingComplete ? (
    <Box
      component="span"
      sx={{ color: (theme) => theme.palette.primary.secondaryText }}
    >
      {numSequences} sequences of length {length}
    </Box>
  ) : (
    <Box
      component="span"
      sx={{ color: (theme) => theme.palette.primary.secondaryText }}
    >
      Parsing... {alignment.numSequencesParsed}{' '}
    </Box>
  );

  const Type = dataType ? (
    <Chip
      sx={{
        height: '30px',
        color: (theme) => theme.palette.input.contrastText,
        backgroundColor: (theme) => theme.palette.input.main,
        border: (theme) => `1px solid ${theme.palette.input.darker}`,
      }}
      label={dataType}
    />
  ) : (
    <CircularProgress variant="indeterminate" size={20} />
  );

  const Content = (
    <div className={classes.content}>
      <div>
        {alignment.run.usesRaxmlNg ? (
          <Box display="flex">
            <Box display="flex" flexWrap="wrap" alignItems="center">
              <OptionSelect
                className={classes.select}
                option={alignment.substitutionModel}
              />
              <OptionTextField
                className={classes.select}
                option={alignment.multistateNumber}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngStationaryFrequencies}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngInvariantSites}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngRateHeterogeneity}
              />
              <OptionSelect
                className={classes.select}
                option={alignment.ngAscertainmentBias}
              />
              <ModelTestButton alignment={alignment} />
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" alignItems="center">
            {alignment.modelExtra ? (
              <OptionSelect
                className={classes.select}
                option={{
                  ...alignment.modelExtra,
                  setValue: alignment.modelExtra.onChange,
                  title: alignment.modelExtra.label,
                  options: alignment.modelExtra.options.map((model) => (
                    {
                      value: model,
                      title: model,
                    }
                  )),
                }}
              />
            ) : null}
            <ModelTestButton alignment={alignment} />
          </Box>
        )}
      </div>
    </div>
  );

  return (
    <Card
      sx={{
        backgroundColor: (theme) => theme.palette.input.light,
        border: (theme) => `1px solid ${theme.palette.input.border}`,
        width: '550px',
        height: '200px',
      }}
    >
      <CardHeader
        classes={{
          root: classes.cardHeaderRoot,
          content: classes.cardHeaderContent,
        }}
        avatar={Type}
        action={
          <div>
            <Tooltip
              aria-label="remove-alignment"
              title="Remove alignment"
            >
              <IconButton onClick={alignment.remove} size="large">
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>

            <IconButton
              aria-owns={anchorEl ? 'alignment-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
              size="large">
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="alignment-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>
                Open aligment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.showFileInFolder)}>
                Show in folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.remove)}>
                Remove alignment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.setShowPartition)}>
                Edit partition
              </MenuItem>
              {alignment.modeltestLoading ? (
                <MenuItem onClick={closeMenuAndRun(alignment.cancelModelTest)}>
                  Cancel modeltest
                </MenuItem>
              ) : null}
            </Menu>
          </div>
        }
        title={alignment.filename}
        subheader={Size}
      />
      <div>
        {alignment.loading ? (
          <div className={classes.loading}>
            <CircularProgress variant="indeterminate" />
          </div>
        ) : null}
      </div>
      <CardContent>{Content}</CardContent>
      <CardActions>
        {alignment.partition.isComplete || alignment.showPartition ? null : (
          <Typography variant="caption" color="primary">
            Partition not complete, click{' '}
            <strong
              style={{ cursor: 'pointer' }}
              onClick={alignment.setShowPartition}
            >
              here
            </strong>{' '}
            to edit.
          </Typography>
        )}
      </CardActions>
    </Card>
  );
}

function FinalAlignmentCard({ sx, alignment }) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleMenuClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function closeMenuAndRun(callback) {
    return () => {
      callback();
      setAnchorEl(null);
    };
  }

  const Size = alignment.parsingComplete ? (
    <Box
      component="span"
      sx={{ color: (theme) => theme.palette.primary.secondaryText }}
    >
      {alignment.numSequences} sequences of length {alignment.length} from{' '}
      {alignment.numAlignments} alignment
      {alignment.numAlignments > 1 ? 's' : ''}
    </Box>
  ) : (
    <Box
      component="span"
      sx={{ color: (theme) => theme.palette.primary.secondaryText }}
    >
      Parsing... {alignment.numSequencesParsed}{' '}
    </Box>
  );

  return (
    <Card
      sx={{
        backgroundColor: (theme) => theme.palette.input.light,
        border: (theme) => `1px solid ${theme.palette.input.border}`,
        ...sx,
      }}
    >
      <CardHeader
        avatar={
          <Chip
            sx={{
              height: '30px',
              color: (theme) => theme.palette.input.contrastText,
              backgroundColor: (theme) => theme.palette.input.main,
              border: (theme) => `1px solid ${theme.palette.input.darker}`,
            }}
            label={alignment.dataType}
            color="secondary"
          />
        }
        action={
          <div>
            <IconButton
              aria-owns={anchorEl ? 'alignment-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
              size="large">
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="alignment-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun(alignment.openFile)}>
                Open aligment
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openPartition)}>
                Open partition
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(alignment.openFolder)}>
                Open folder
              </MenuItem>
            </Menu>
          </div>
        }
        title={alignment.filename}
        subheader={Size}
        style={{ paddingBottom: 4 }}
      />
      <CardContent style={{ paddingTop: 0 }}>
        <FormControlLabel
          title="Use union (on) or intersection (off) of taxons from all alignments"
          control={
            <InputSwitch
              checked={alignment.fillTaxonGapsWithEmptySeqeunces}
              onChange={(event) => {
                alignment.setFillTaxonGapsWithEmptySeqeunces(
                  event.target.checked
                );
              }}
              value="fillTaxonGapsWithEmptySeqeunces"
            />
          }
          label={
            <Typography variant="body2">
              Fill taxon gaps with empty sequences
            </Typography>
          }
        />
        <div className={classes.partitionFileContainer}>
          <code className={classes.partitionFileContent}>
            {alignment.partition.text}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>

AlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
};

FinalAlignmentCard.propTypes = {
  alignment: PropTypes.object.isRequired,
  sx: PropTypes.object,
};

const AlignmentCardObserver = observer(AlignmentCard);
const FinalAlignmentCardObserver = observer(FinalAlignmentCard);

export default AlignmentCardObserver;
export { FinalAlignmentCardObserver as FinalAlignmentCard };
