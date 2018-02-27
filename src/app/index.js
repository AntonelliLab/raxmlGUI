import React from 'react';
import { MuiThemeProvider } from 'material-ui/styles';
import Reboot from 'material-ui/Reboot';
import theme from './theme';
import App from './App';

const Index = () => (
  <MuiThemeProvider theme={theme}>
    <Reboot />
    <App />
  </MuiThemeProvider>
);

export default Index;