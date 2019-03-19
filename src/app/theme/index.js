import { createMuiTheme } from '@material-ui/core/styles';
// import purple from '@material-ui/core/colors/purple';
// import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    // primary: {
    //   light: purple[300],
    //   main: purple[500],
    //   dark: purple[700],
    // },
    // secondary: {
    //   light: green[300],
    //   main: green[500],
    //   dark: green[700],
    // },
    error: {
      main: red[500],
    },
    // Used by `getContrastText()` to maximize the contrast between the background and
    // the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
  },
});

export default theme;