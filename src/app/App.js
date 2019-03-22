import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconAdd from '@material-ui/icons/Add';
// import Dropzone from 'react-dropzone'

import Input from './Input';
import Raxml from './Raxml';
import './App.css';
import store from './store';

const styles = theme => ({
  input: {
    // borderBottom: `1px solid ${theme.palette.primary.main}`,
  },
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
    padding: '0 4px',
  },
  tabIcon: {
    marginRight: theme.spacing.unit,
  },
});

class App extends React.Component {

  handleTabChange = (event, value) => {
    store.setActive(value);
  }

  render() {
    const { classes } = this.props;

    const TabItems = store.models.map(model => (
      <Tab key={model.id} icon={
        <span className={classes.tab}>
          <CircularProgress color="inherit" size={20} className={classes.tabIcon}
            variant={model.running ? "indeterminate" : "static"} value={100} />
          {`Model ${model.id}`}
        </span>
      } />
    ));

    return (
      <React.Fragment>
        <CssBaseline />
        <div className="App">
          <Input input={store.input} />

          <AppBar position="static" className={classes.AppBar}>
            <Tabs value={store.activeIndex} onChange={this.handleTabChange}>
              { TabItems }
            </Tabs>
            <Toolbar className={classes.Toolbar}>
              <IconButton onClick={store.addModel}>
                <IconAdd />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Raxml model={store.activeModel} />
        </div>
      </React.Fragment>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(observer(App));