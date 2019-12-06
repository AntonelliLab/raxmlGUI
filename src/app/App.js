import React from 'react';
import { observer } from 'mobx-react';
import { makeStyles } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconAdd from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/DeleteForever';
import Box from '@material-ui/core/Box';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarMessage from './components/SnackbarMessage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDialog from './components/ErrorDialog';
import clsx from 'clsx';
import Model from './Model';
import Input from './Input';
import Output from './Output';
import Raxml from './Raxml';
import Console from './Console';
import './App.css';
import store from './store';
import SplitPane from 'react-split-pane';
import { Typography } from '@material-ui/core';
import { version } from '../../package.json';

const useStyles = makeStyles(theme => ({
  App: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  splitPane: {
  },
  ioContainer: {
    height: 'calc(100vh - 20px)',
    overflowY: 'auto',
  },
  statusBar: {
    top: 'auto',
    bottom: 0,
    height: 20,
    minHeight: 20,
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: '#333',
    borderTop: '1px solid #444',
    color: '#aaa',
    fontSize: 12,
  },
  statusToolbar: {
    minHeight: 20,
    margin: 0,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  },
  statusVersion: {
    flexGrow: 1,
  },
  statusFeedback: {
    color: '#fff',
    marginLeft: 20,
  },
  AppBar: {
    display: 'flex',
    flexDirection: 'row'
  },
  Toolbar: {
    minHeight: 0
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 40px',
    position: 'relative'
  },
  tabIcon: {
    left: 10,
    position: 'absolute'
  },
  leftPanel: {
  },
  rightPanel: {
    borderLeft: '2px solid #999',
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
    borderTop: '2px solid hsl(0, 0%, 25%)',
    borderBottom: '2px solid hsl(0, 0%, 25%)',
  },
  input: {
  },
  output: {
    flexGrow: 1,
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
    borderRight: '1px solid #666',
  },
  inputHeading: {
    backgroundColor: theme.palette.input.main,
    borderRight: `1px solid ${theme.palette.input.light}`,
  },
  modelHeading: {
    backgroundColor: theme.palette.model.main,
    borderRight: `1px solid ${theme.palette.model.light}`,
  },
  outputHeading: {
    backgroundColor: theme.palette.output.main,
    borderRight: `1px solid ${theme.palette.output.light}`,
  },
  raxmlHeading: {
    backgroundColor: '#333',
  },
  consoleHeading: {
    backgroundColor: '#333',
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
  },
  console: {
    height: '100%',
    borderTop: '1px solid rgba(255,255,255,0.3)',
  },
  deleteIcon: {
    '&:hover': {
      color: '#999',
    },
  }
}));

const App = () => {
  const classes = useStyles();

  const TabItems = store.runs.map(run => (
    <Tab
      key={run.id}
      icon={
        <span className={classes.tab}>
          <CircularProgress
            color="inherit"
            size={20}
            className={classes.tabIcon}
            variant={run.running ? 'indeterminate' : 'static'}
            value={0}
          />
          {`Run ${run.id}`}
        </span>
      }
    />
  ));

  const run = store.activeRun;

  return (
    <React.Fragment>
      <CssBaseline />
      <div className={classes.App}>
        {store.runs.length === 1 ? null : (
          <AppBar position="static" className={classes.AppBar}>
            <Tabs
              value={store.activeIndex}
              onChange={(event, value) => store.setActive(value)}
            >
              {TabItems}
            </Tabs>
            <Toolbar className={classes.Toolbar}>
              <IconButton onClick={store.addRun}>
                <IconAdd />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <SplitPane split="vertical" size={640} minSize={100}>
          <Box display="flex" flexDirection="column" className={clsx(classes.ioContainer, classes.leftPanel)}>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.input}`}>
              <Typography
                className={`${classes.verticalHeading} ${classes.inputHeading}`}
              >
                Input
              </Typography>
              <div className={clsx(classes.ioItem, classes.inputContainer)}>
                <Input run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.model}`}>
              <Typography
                className={`${classes.verticalHeading} ${classes.modelHeading}`}
              >
                Analysis
              </Typography>
              <div className={clsx(classes.ioItem, classes.modelContainer)}>
                <Model run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.output}`}>
              <Typography
                className={`${classes.verticalHeading} ${
                  classes.outputHeading
                }`}
              >
                Output
              </Typography>
              <div className={clsx(classes.ioItem, classes.outputContainer)}>
                <Output run={run} />
              </div>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" className={clsx(classes.ioContainer, classes.rightPanel)}>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.raxml}`}>
              <Typography
                className={`${classes.verticalHeading} ${classes.raxmlHeading}`}
              >
                RAxML
              </Typography>
              <div className={classes.ioItem}>
                <Raxml run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.console}`}>
              <Typography
                className={`${classes.verticalHeading} ${
                  classes.consoleHeading
                }`}
              >
                Console
                {run.stdout === '' ? null : (
                  <DeleteIcon onClick={run.clearStdout} className={classes.deleteIcon} title="Clear console"/>
                )}
              </Typography>
              <div className={classes.ioItem}>
                <Console run={run} />
              </div>
            </Box>
          </Box>
        </SplitPane>
        <AppBar position="fixed" color="primary" className={classes.statusBar}>
          <Toolbar className={classes.statusToolbar}>
            <div className={classes.statusVersion}>raxmlGUI {version}</div>
            <a className={classes.statusFeedback} href="mailto:raxmlgui.help@googlemail.com?subject=Feedback">
              Please send us feedback!
            </a>
          </Toolbar>
        </AppBar>
        <ErrorBoundary>
          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            open={run.finished}
            autoHideDuration={6000}
            onClose={run.clearFinished}
          >
            <SnackbarMessage
              onClose={run.clearFinished}
              variant={run.exitCode === 0 ? "success" : "info"}
              message={run.exitCode === 0 ? "RAxML finished!" : `RAxML cancelled!`}
            />
          </Snackbar>
          <ErrorDialog error={run.error} onClose={run.clearError} />
        </ErrorBoundary>
        <ErrorDialog error={store.error} onClose={store.clearError} />
      </div>
    </React.Fragment>
  );
};

export default observer(App);
