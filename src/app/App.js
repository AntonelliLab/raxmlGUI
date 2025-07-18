import React from 'react';
import { observer } from 'mobx-react';
import clsx from 'clsx';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { makeStyles } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconAdd from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Typography } from '@mui/material';
import Modal from '@mui/material/Modal';

import Model from './Model';
import Input from './Input';
import Output from './Output';
import Raxml from './Raxml';
import Console from './Console';
import store from './store';
import PartitionEditor from './PartitionEditor';
import CitationModal from './CitationModal';

import ErrorBoundary from './components/ErrorBoundary';
import ErrorDialog from './components/ErrorDialog';
import ModifiedDialog from './components/ModifiedDialog';

import './App.css';

const useStyles = makeStyles((theme) => ({
  App: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: theme.palette.primary.background,
  },
  ioContainer: {
    // height: 'calc(100vh - 20px)',
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '20px',
  },
  statusBar: {
    top: 'auto',
    bottom: 0,
    height: 20,
    minHeight: 20,
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: theme.palette.status.main,
    borderTop: `1px solid ${theme.palette.status.border}`,
    color: theme.palette.status.contrastText,
    fontSize: 12,
  },
  statusToolbar: {
    minHeight: 20,
    margin: 0,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusVersion: {
    marginRight: 20,
  },
  statusCite: {
    color: theme.palette.status.contrastText,
    cursor: 'pointer',
    marginLeft: 20,
  },
  statusFeedback: {
    color: theme.palette.status.contrastText,
    marginLeft: 20,
  },
  AppBar: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: theme.palette.input.background,
  },
  Toolbar: {
    minHeight: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 40px',
    position: 'relative',
  },
  tabChip: {
    border: 'none',
  },
  tabIcon: {},
  leftPanel: {},
  rightPanel: {
    borderLeft: '1px solid #ccc',
  },
  ioWrapper: {
    width: '100%',
  },
  ioItem: {
    width: '100%',
    height: '100%',
    overflowX: 'hidden',
  },
  model: {
    borderTop: '2px solid #ccc',
    borderBottom: '2px solid #ccc',
    backgroundColor: theme.palette.model.background,
  },
  input: {
    backgroundColor: theme.palette.input.background,
  },
  output: {
    flexGrow: 1,
    backgroundColor: theme.palette.output.background,
  },
  verticalHeading: {
    writingMode: 'vertical-rl',
    textOrientation: 'upright',
    // textAlign: 'right',
    // transform: 'rotate(180deg)',
    // textAlign: 'center',
    padding: '10px 5px',
    // fontWeight: 'bold',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    borderRight: '1px solid #ccc',
  },
  inputHeading: {
    backgroundColor: theme.palette.input.main,
    borderRight: `1px solid ${theme.palette.input.border}`,
    // boxShadow: `2px 0 5px ${theme.palette.input.shadow}`,
  },
  modelHeading: {
    backgroundColor: theme.palette.model.main,
    borderRight: `1px solid ${theme.palette.model.border}`,
    // boxShadow: `2px 0 5px ${theme.palette.model.shadow}`,
  },
  outputHeading: {
    backgroundColor: theme.palette.output.main,
    borderRight: `1px solid ${theme.palette.output.border}`,
    // boxShadow: `2px 0 5px ${theme.palette.output.shadow}`,
  },
  raxmlHeading: {
    backgroundColor: theme.palette.raxml.main,
    // boxShadow: `2px 0 5px ${theme.palette.raxml.shadow}`,
  },
  consoleHeading: {
    backgroundColor: theme.palette.console.main,
    // boxShadow: `2px 0 5px ${theme.palette.console.shadow}`,
    zIndex: 10,
  },
  inputContainer: {
    // backgroundColor: theme.palette.input.dark,
  },
  modelContainer: {
    // backgroundColor: theme.palette.model.dark,
  },
  outputContainer: {
    // backgroundColor: theme.palette.output.dark,
  },
  raxml: {
    backgroundColor: theme.palette.raxml.background,
  },
  console: {
    backgroundColor: theme.palette.console.background,
    height: '100%',
    borderTop: '2px solid #ccc',
  },
  deleteIcon: {
    '&:hover': {
      color: '#999',
    },
  },
  Modal: {
    margin: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const App = () => {
  const classes = useStyles();

  const TabItems = store.runs.map((run) => (
    <Tab
      key={run.id}
      icon={
        <span className={classes.tab}>
          <Chip
            classes={{ root: classes.tabChip }}
            icon={
              <CircularProgress
                color="inherit"
                size={20}
                className={classes.tabIcon}
                variant={run.running ? 'indeterminate' : 'determinate'}
                value={0}
              />
            }
            label={`Run ${run.id}`}
            onDelete={() => {
              run.removeRun();
            }}
            variant="outlined"
          />
        </span>
      }
    />
  ));

  function fileModifiedSnack(run) {
    let message = 'Something happened';
    if (run.converted) {
      message = `Converted your ${run.convertedAlignmentFrom} alignment into fasta!`;
    }
    if (run.modified) {
      message = `Made a copy of your input file, because there were some issues!`;
    }
    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={run.showModifiedSnack}
        onClose={run.clearShowModified}
      >
        <Alert
          onClose={run.clearShowModified}
          severity="info"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    );
  }

  function appSnack(store) {
    const message = 'Command copied';
    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={store.showAppSnack}
        onClose={store.clearAppSnack}
      >
        <Alert
          onClose={store.clearAppSnack}
          severity="info"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    );
  }

  const run = store.activeRun;
  const { binary } = run;
  return (
    <React.Fragment>
      <CssBaseline />
      <div className={classes.App}>
        {store.runs.length <= 1 ? null : (
          <AppBar position="static" elevation={1} className={classes.AppBar}>
            <Tabs
              value={store.activeIndex}
              onChange={(event, value) => store.setActive(value)}
            >
              {TabItems}
            </Tabs>
            <Toolbar variant="dense" className={classes.Toolbar}>
              <IconButton onClick={store.addRun} size="large">
                <IconAdd />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <Allotment defaultSizes={[640, 400]} minSize={100}>
          <Allotment.Pane>
            <Box
              display="flex"
              flexDirection="column"
              className={clsx(classes.ioContainer, classes.leftPanel)}
            >
              <Box
                display="flex"
                className={`${classes.ioWrapper} ${classes.input}`}
              >
                <Typography
                  className={`${classes.verticalHeading} ${classes.inputHeading}`}
                >
                  Input
                </Typography>
                <div className={clsx(classes.ioItem, classes.inputContainer)}>
                  <Input run={run} />
                </div>
              </Box>
              <Box
                display="flex"
                className={`${classes.ioWrapper} ${classes.model}`}
              >
                <Typography
                  className={`${classes.verticalHeading} ${classes.modelHeading}`}
                >
                  Analysis
                </Typography>
                <div className={clsx(classes.ioItem, classes.modelContainer)}>
                  <Model run={run} />
                </div>
              </Box>
              <Box
                display="flex"
                className={`${classes.ioWrapper} ${classes.output}`}
              >
                <Typography
                  className={`${classes.verticalHeading} ${classes.outputHeading}`}
                >
                  Output
                </Typography>
                <div className={clsx(classes.ioItem, classes.outputContainer)}>
                  <Output run={run} />
                </div>
              </Box>
            </Box>
          </Allotment.Pane>

          <Allotment.Pane>
            <Box
              display="flex"
              flexDirection="column"
              className={clsx(classes.ioContainer, classes.rightPanel)}
            >
              <Box
                display="flex"
                className={`${classes.ioWrapper} ${classes.raxml}`}
              >
                <Typography
                  className={`${classes.verticalHeading} ${classes.raxmlHeading}`}
                >
                  RAxML
                </Typography>
                <div className={classes.ioItem}>
                  <Raxml run={run} store={store} />
                </div>
              </Box>
              <Box
                display="flex"
                className={`${classes.ioWrapper} ${classes.console}`}
              >
                <Typography
                  className={`${classes.verticalHeading} ${classes.consoleHeading}`}
                >
                  Console
                  {run.stdout === '' && run.stderr === '' ? null : (
                    <DeleteIcon
                      onClick={run.clearConsole}
                      className={classes.deleteIcon}
                      title="Clear console"
                    />
                  )}
                </Typography>
                <div className={classes.ioItem}>
                  <Console run={run} />
                </div>
              </Box>
            </Box>
          </Allotment.Pane>
        </Allotment>
        <AppBar position="fixed" color="primary" className={classes.statusBar}>
          <Toolbar className={classes.statusToolbar}>
            <IconButton
              onClick={() => store.config.setDarkMode(!store.config.isDarkMode)}
              size="small"
              title={
                store.config.isDarkMode
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              sx={{ mr: 2, color: 'inherit' }}
            >
              {store.config.isDarkMode ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
            <Box display="flex">
              {/* In dev mode the app version shown is from electron, in production it is ours */}
              <div className={classes.statusVersion}>
                raxmlGUI {store.version}
              </div>
              <div className={classes.statusVersion}>
                {binary.value} {binary.version}
              </div>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box display="flex">
              <span
                className={classes.statusCite}
                onClick={store.citation.show}
              >
                How to cite?
              </span>
              <a
                className={classes.statusFeedback}
                href="mailto:raxmlgui.help@googlemail.com?subject=Feedback"
              >
                For questions or suggestions contact us!
              </a>
            </Box>
          </Toolbar>
        </AppBar>
        <ErrorBoundary>
          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            open={run.finished}
            autoHideDuration={6000}
            onClose={run.clearFinished}
          >
            <Alert
              onClose={run.clearFinished}
              severity={run.exitCode === 0 ? 'success' : 'info'}
              sx={{ width: '100%' }}
            >
              {run.exitCode === 0
                ? 'Calculation finished!'
                : `Calculation cancelled!`}
            </Alert>
          </Snackbar>
          {fileModifiedSnack(run)}
          {appSnack(store)}
          <ErrorDialog error={run.error} onClose={run.clearError} />
          <ModifiedDialog
            show={run.showModifiedDialog}
            onClose={run.clearShowModified}
            messages={run.modificationMessages}
          />
        </ErrorBoundary>

        {run.showPartitionFor === null ? null : (
          <Modal
            aria-labelledby="show-partition"
            open={true}
            onClose={run.hidePartition}
            className={classes.Modal}
          >
            <div id="show-partition">
              <PartitionEditor alignment={run.showPartitionFor} />
            </div>
          </Modal>
        )}
        {store.citation.visible ? (
          <Modal
            aria-labelledby="show-citation"
            open={true}
            onClose={store.citation.hide}
            className={classes.Modal}
          >
            <div id="show-citation">
              <CitationModal citation={store.citation} />
            </div>
          </Modal>
        ) : null}
        <ErrorDialog error={store.error} onClose={store.clearError} />
      </div>
    </React.Fragment>
  );
};

export default observer(App);
