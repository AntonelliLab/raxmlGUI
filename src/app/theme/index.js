import { createMuiTheme } from '@material-ui/core/styles';
import amber from '@material-ui/core/colors/amber';
import pink from '@material-ui/core/colors/pink';
import teal from '@material-ui/core/colors/teal';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    // primary: {
    //   main: '#7b3352',
    // },
    // secondary: {
    //   main: '#2d547d',
    // },
    primary: teal,
    secondary: pink,
    model: {
      main: '#3B4E2D',
    },
    input: {
      main: '#4E293A',
    },
    output: {
      main: '#233242',
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

export default theme;
