import React from 'react';
import { observer } from 'mobx-react-lite';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as Sentry from '@sentry/electron/renderer';

import theme from './theme';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import store from './store';

import './bootstrap';

if ( process.env.NODE_ENV !== 'development' ) {
  Sentry.init();
}

const Index = (): React.JSX.Element => {
  const { light, dark } = theme;
  const muiTheme = store.config.isDarkMode
    ? dark
    : light;
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default observer( Index );
