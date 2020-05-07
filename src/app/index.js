import React from 'react';
import { observer } from 'mobx-react';
import { ThemeProvider } from '@material-ui/styles';

import theme from './theme';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import store from './store';
import './bootstrap';


const Index = () => {
  const { light, dark } = theme;
  const muiTheme = store.config.isDarkMode ? dark : light;
  return (
    <ThemeProvider theme={muiTheme}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default observer(Index);

