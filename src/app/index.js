import React from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from './theme';
import App from './App';

const Index = () => (
  <MuiThemeProvider theme={theme}>
    <App />
  </MuiThemeProvider>
);

export default Index;