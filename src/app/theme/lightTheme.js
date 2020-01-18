import { createMuiTheme } from '@material-ui/core/styles';
import amber from '@material-ui/core/colors/amber';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

const lightTheme = createMuiTheme({
  palette: {
    type: 'light',
    primary: {
      main: amber[500],
      contrastText: '#fff',
    },
    secondary: {
      main: grey[500],
      contrastText: '#fff',
    },
    model: {
      light: 'hsla(332, 41%, 39%, 1)',
      main: 'hsla(332, 41%, 33%, 1)',
      dark: 'hsla(332, 41%, 27%, 1)',
      darker: 'hsla(332, 41%, 21%, 1)',
      secondaryText: 'hsla(332, 19%, 64%, 1)',
    },
    input: {
      light: 'hsla(95, 37%, 39%, 1)',
      main: 'hsla(95, 37%, 33%, 1)',
      dark: 'hsla(95, 37%, 27%, 1)',
      darker: 'hsla(95, 37%, 21%, 1)',
      secondaryText: 'hsla(95, 19%, 64%, 1)',
    },
    output: {
      light: 'hsla(211, 41%, 39%, 1)',
      main: 'hsla(211, 41%, 33%, 1)',
      dark: 'hsla(211, 41%, 27%, 1)',
      darker: 'hsla(211, 41%, 21%, 1)',
    },
    error: red,
    // Used by `getContrastText()` to maximize the contrast between the background and
    // the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2
  },
  // Migration to typography v2
  typography: {
    useNextVariants: true
  }
});

export default lightTheme;
