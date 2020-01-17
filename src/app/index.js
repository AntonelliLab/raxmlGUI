import React from 'react';
import { ThemeProvider } from '@material-ui/styles';

import theme from './theme';
import lightTheme from './theme/lightTheme';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const Index = () => (
  <ThemeProvider theme={theme}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ThemeProvider>
);

export default Index;


if (process.env.NODE_ENV === 'development') {
  import('./bootstrap');
}
