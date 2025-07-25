import React from 'react';
import { observer } from 'mobx-react-lite';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as Sentry from '@sentry/electron/renderer';

import theme from './theme';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import store from './store';
import { is } from '../common/utils';

import './bootstrap';

is.development ? null : Sentry.init({
  dsn: 'https://d92efa46c2ba43f38250b202c791a2c2@o117148.ingest.sentry.io/6517975',
});

const Index = () => {
  const { light, dark } = theme;
  const muiTheme = store.config.isDarkMode ? dark : light;
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default observer(Index);

