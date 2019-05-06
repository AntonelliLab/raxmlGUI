import React from 'react';
import { ThemeProvider } from '@material-ui/styles';

import theme from './theme';
import App from './App';

const Index = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);

export default Index;
