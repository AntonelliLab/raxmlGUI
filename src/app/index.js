import React from 'react';
import { ThemeProvider } from '@material-ui/styles';

import theme from './theme';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './bootstrap';


const Index = () => (
  <ThemeProvider theme={theme}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ThemeProvider>
);

export default Index;
