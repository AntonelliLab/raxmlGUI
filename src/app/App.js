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

import Input from './Input';
import Raxml from './Raxml';
import './App.css';
import store from './store';

const useStyles = makeStyles({
  AppBar: {
    display: 'flex',
    flexDirection: 'row',
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
  tabIcon: {
    left: 10,
    position: 'absolute',
  },
});

const App = () => {

  const classes = useStyles();

  const TabItems = store.runs.map(run => (
    <Tab key={run.id} icon={
      <span className={classes.tab}>
        <CircularProgress color="inherit" size={20} className={classes.tabIcon}
          variant={run.running ? "indeterminate" : "static"} value={0} />
        {`Run ${run.id}`}
      </span>
    } />
  ));

  return (
    <React.Fragment>
      <CssBaseline />
      <div className="App">
        { store.runs.length === 1 ? null : (
          <AppBar position="static" className={classes.AppBar}>
            <Tabs value={store.activeIndex} onChange={(event, value) => store.setActive(value)}>
              { TabItems }
            </Tabs>
            <Toolbar className={classes.Toolbar}>
              <IconButton onClick={store.addRun}>
                <IconAdd />
              </IconButton>
            </Toolbar>
          </AppBar>
        ) }

        <div className="AppContent">
          <Input run={store.activeRun} />

          <Raxml run={store.activeRun} />
        </div>
      </div>
    </React.Fragment>
  );
}

export default observer(App);
