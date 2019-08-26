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

const useStyles = makeStyles(theme => ({
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
  ioContainer: {
    height: '100vh',
    overflowY: 'auto',
  },
  leftPanel: {
  },
  rightPanel: {
    borderLeft: '1px solid #999',
  },
  ioWrapper: {
    width: '100%',
  },
  ioItem: {
    width: '100%',
    // overflowX: 'auto',
    // flexGrow: 1,
    // padding: '10px 5px 10px 10px',
  },
  model: {
  },
  input: {
    // height: '100%',
    // maxWidth: '800px',
    borderTop: '1px solid rgba(255,255,255,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
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
    fontWeight: 'bold',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    borderRight: '1px solid #666',
  },
  modelHeading: {
    backgroundColor: theme.palette.model.main,
  },
  inputHeading: {
    backgroundColor: theme.palette.input.main,
  },
  outputHeading: {
    backgroundColor: theme.palette.output.main,
  },
  raxmlHeading: {
    backgroundColor: '#333',
  },
  consoleHeading: {
    backgroundColor: '#333',
  },
  raxml: {
  },
  console: {
    flexGrow: 1,
    borderTop: '1px solid rgba(255,255,255,0.3)',
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
      <div className="App">
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
            <Box display="flex" className={`${classes.ioWrapper} ${classes.model}`}>
              <div
                className={`${classes.verticalHeading} ${classes.modelHeading}`}
              >
                Model
              </div>
              <div className={classes.ioItem}>
                <Model run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.input}`}>
              <div
                className={`${classes.verticalHeading} ${classes.inputHeading}`}
              >
                Input
              </div>
              <div className={classes.ioItem}>
                <Input run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.output}`}>
              <div
                className={`${classes.verticalHeading} ${
                  classes.outputHeading
                }`}
              >
                Output
              </div>
              <div className={classes.ioItem}>
                <Output run={run} />
              </div>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" className={clsx(classes.ioContainer, classes.rightPanel)}>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.raxml}`}>
              <div
                className={`${classes.verticalHeading} ${classes.raxmlHeading}`}
              >
                RAxML
              </div>
              <div className={classes.ioItem}>
                <Raxml run={run} />
              </div>
            </Box>
            <Box display="flex" className={`${classes.ioWrapper} ${classes.console}`}>
              <div
                className={`${classes.verticalHeading} ${
                  classes.consoleHeading
                }`}
              >
                Console
              </div>
              <div className={classes.ioItem}>
                <Console run={run} />
              </div>
            </Box>
          </Box>
        </SplitPane>
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
              variant="success"
              message="RAxML finished!"
            />
          </Snackbar>
          <ErrorDialog error={run.error} onClose={run.clearError} />
        </ErrorBoundary>
      </div>
    </React.Fragment>
  );
};

export default observer(App);
