import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
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
    heading: {
      display: 'flex',
      alignItems: 'center',
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
    path: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
      marginLeft: 4,
    },
    button: {
      margin: theme.spacing(1),
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
    remove: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'flex-end',
    },
    selectWide: {
      marginLeft: '10px',
      minWidth: '200px',
    },
  };
});

function _ModelTestButton({ alignment }) {
  if (!alignment.modelTestCanRun) {
    return null;
  }
  return (
    <Button
      sx={{
        marginLeft: '10px',
        backgroundColor: (theme) => theme.palette.input.main,
        border: (theme) => `1px solid ${theme.palette.input.darker}`,
        color: (theme) => theme.palette.input.contrastText,
        '&:hover': {
          backgroundColor: (theme) => theme.palette.input.main,
        },
      }}
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: '-10px',
      }}
    >
      <Box>
        {alignment.run.usesRaxmlNg ? (
          <Box display="flex">
            <Box display="flex" flexWrap="wrap" alignItems="center">
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.substitutionModel}
              />
              <OptionTextField
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.multistateNumber}
              />
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.ngStationaryFrequencies}
              />
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.ngInvariantSites}
              />
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.ngRateHeterogeneity}
              />
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
                option={alignment.ngAscertainmentBias}
              />
              <ModelTestButton alignment={alignment} />
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" alignItems="center">
            {alignment.modelExtra ? (
              <OptionSelect
                sx={{
                  marginLeft: '10px',
                  minWidth: '150px',
                }}
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
      </Box>
    </Box>
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
        sx={{
          overflow: 'hidden',
          '& .MuiCardHeader-content': {
            overflow: 'hidden',
          },
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
      <Box>
        {alignment.loading ? (
          <Box sx={{ marginLeft: '10px' }}>
            <CircularProgress variant="indeterminate" />
          </Box>
        ) : null}
      </Box>
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
        <Box
          sx={{
            overflowY: 'auto',
            height: 50,
          }}
        >
          <Box
            component="code"
            sx={{
              color: (theme) => theme.palette.primary.contrastText,
              fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
              fontSize: '10px',
              height: '100%',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {alignment.partition.text}
          </Box>
        </Box>
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
