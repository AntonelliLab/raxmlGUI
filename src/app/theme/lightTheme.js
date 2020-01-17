import { createMuiTheme } from '@material-ui/core/styles';
import amber from '@material-ui/core/colors/amber';
import grey from '@material-ui/core/colors/grey';

const lightTheme = createMuiTheme({
  palette: {
    type: 'light',
    primary: {
      main: amber[500],
      contrastText: '#fff',
    },
    secondary: {
      main: grey[500],
      // main: '#4E293A',
      contrastText: '#fff',
    },
    // primary: amber,
    // secondary: teal,
    model: {
      // light: '#6E495A',
      light: 'hsla(332, 31%, 29%, 1)',
      main: 'hsla(332, 31%, 23%, 1)',
      // dark: '#2C0718',
      dark: 'hsla(332, 31%, 17%, 1)',
      // darker: '#1C0008',
      darker: 'hsla(332, 31%, 11%, 1)',
      secondaryText: 'hsla(332, 9%, 54%, 1)',
    },
    input: {
      // light: '#5B6E4D',
      light: 'hsla(95, 27%, 29%, 1)',
      // main: '#3B4E2D',
      main: 'hsla(95, 27%, 23%, 1)',
      // dark: '#192C0B',
      dark: 'hsla(95, 27%, 17%, 1)',
      // darker: '#091C00',
      darker: 'hsla(95, 27%, 11%, 1)',
      secondaryText: 'hsla(95, 9%, 54%, 1)',
    },
    output: {
      // light: '#435262',
      light: 'hsla(211, 31%, 29%, 1)',
      // main: '#233242',
      main: 'hsla(211, 31%, 23%, 1)',
      // dark: '#011020',
      dark: 'hsla(211, 31%, 17%, 1)',
      // darker: '#000010',
      darker: 'hsla(211, 31%, 11%, 1)',
    },
    error: amber,
    // error: {
    //   main: '#f2401b',
    // },
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
