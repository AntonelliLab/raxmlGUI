import { createMuiTheme } from '@material-ui/core/styles';

const darkTheme = {
  palette: {
    type: 'dark',
    primary: {
      background: 'hsl(29, 5%, 5%)',
      border: 'hsl(29, 80%, 38%)',
      main: 'hsl(29, 80%, 30%)',
      contrastText: '#333',
    },
    secondary: {
      main: 'hsl(29, 80%, 30%)',
      // main: 'hsl(180, 50%, 50%)',
      contrastText: '#333',
    },
    model: {
      background: 'hsla(33, 27%, 10%, 1)',
      border: 'hsla(33, 27%, 30%, 1)',
      lighter: 'hsla(33, 27%, 43%, 1)',
      light: 'hsla(33, 27%, 27%, 1)',
      main: 'hsla(33, 27%, 23%, 1)',
      dark: 'hsla(33, 27%, 18%, 1)',
      darker: 'hsla(33, 27%, 12%, 1)',
      secondaryText: 'hsla(33, 9%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(33, 2%, 20%, 1)',
    },
    input: {
      background: 'hsla(92, 27%, 10%, 1)',
      border: 'hsla(92, 27%, 30%, 1)',
      lighter: 'hsla(92, 27%, 43%, 1)',
      light: 'hsla(92, 27%, 27%, 1)',
      main: 'hsla(92, 27%, 23%, 1)',
      dark: 'hsla(92, 27%, 18%, 1)',
      darker: 'hsla(92, 27%, 12%, 1)',
      secondaryText: 'hsla(92, 9%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(92, 2%, 20%, 1)',
    },
    output: {
      background: 'hsla(211, 27%, 10%, 1)',
      border: 'hsla(211, 27%, 30%, 1)',
      lighter: 'hsla(211, 27%, 43%, 1)',
      light: 'hsla(211, 27%, 27%, 1)',
      main: 'hsla(211, 27%, 23%, 1)',
      dark: 'hsla(211, 27%, 18%, 1)',
      darker: 'hsla(211, 27%, 12%, 1)',
      secondaryText: 'hsla(211, 9%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(211, 2%, 20%, 1)',
    },
    raxml: {
      border: 'hsla(211, 0%, 28%, 1)',
      background: 'hsla(211, 0%, 10%, 1)',
      lighter: 'hsla(211, 0%, 12%, 1)',
      light: 'hsla(211, 0%, 18%, 1)',
      main: 'hsla(211, 0%, 23%, 1)',
      dark: 'hsla(211, 0%, 35%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(211, 2%, 10%, 1)',
    },
    console: {
      border: 'hsla(211, 0%, 28%, 1)',
      background: 'hsla(211, 0%, 10%, 1)',
      lighter: 'hsla(211, 0%, 12%, 1)',
      light: 'hsla(211, 0%, 18%, 1)',
      main: 'hsla(211, 0%, 23%, 1)',
      dark: 'hsla(211, 0%, 35%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(211, 2%, 10%, 1)',
    },
    status: {
      border: 'hsla(211, 0%, 28%, 1)',
      background: 'hsla(211, 0%, 10%, 1)',
      lighter: 'hsla(211, 0%, 12%, 1)',
      light: 'hsla(211, 0%, 18%, 1)',
      main: 'hsla(211, 0%, 23%, 1)',
      dark: 'hsla(211, 0%, 35%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#fefefe',
      shadow: 'hsla(211, 2%, 10%, 1)',
    },
    // error: amber,
    error: {
      main: '#f2401b',
    },
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
};

const lightTheme = {
  palette: {
    type: 'light',
    primary: {
      background: 'hsl(29, 99%, 99%)',
      border: 'hsl(29, 80%, 87%)',
      main: 'hsl(29, 80%, 50%)',
      contrastText: '#333',
    },
    secondary: {
      main: 'hsl(29, 80%, 50%)',
      // main: 'hsl(180, 50%, 50%)',
      contrastText: '#333',
    },
    model: {
      background: 'hsla(33, 34%, 98%, 1)',
      border: 'hsla(33, 34%, 73%, 1)',
      lighter: 'hsla(33, 34%, 93%, 1)',
      light: 'hsla(33, 34%, 87%, 1)',
      main: 'hsla(33, 34%, 83%, 1)',
      dark: 'hsla(33, 34%, 77%, 1)',
      darker: 'hsla(33, 34%, 41%, 1)',
      secondaryText: 'hsla(33, 9%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(33, 2%, 64%, 1)',
    },
    input: {
      background: 'hsla(92, 34%, 98%, 1)',
      border: 'hsla(92, 34%, 73%, 1)',
      lighter: 'hsla(92, 34%, 93%, 1)',
      light: 'hsla(92, 34%, 87%, 1)',
      main: 'hsla(92, 34%, 83%, 1)',
      dark: 'hsla(92, 34%, 77%, 1)',
      darker: 'hsla(92, 34%, 41%, 1)',
      secondaryText: 'hsla(92, 9%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(92, 2%, 64%, 1)',
    },
    output: {
      background: 'hsla(211, 34%, 98%, 1)',
      border: 'hsla(211, 34%, 73%, 1)',
      lighter: 'hsla(211, 34%, 93%, 1)',
      light: 'hsla(211, 34%, 87%, 1)',
      main: 'hsla(211, 34%, 83%, 1)',
      dark: 'hsla(211, 34%, 77%, 1)',
      darker: 'hsla(211, 34%, 41%, 1)',
      secondaryText: 'hsla(211, 9%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(211, 2%, 64%, 1)',
    },
    raxml: {
      border: 'hsla(211, 0%, 10%, 1)',
      background: 'hsla(211, 0%, 98%, 1)',
      lighter: 'hsla(211, 0%, 96%, 1)',
      light: 'hsla(211, 0%, 96%, 1)',
      main: 'hsla(211, 0%, 90%, 1)',
      dark: 'hsla(211, 0%, 77%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(211, 2%, 64%, 1)',
    },
    console: {
      border: 'hsla(211, 0%, 10%, 1)',
      background: 'hsla(211, 0%, 98%, 1)',
      lighter: 'hsla(211, 0%, 96%, 1)',
      light: 'hsla(211, 0%, 96%, 1)',
      main: 'hsla(211, 0%, 90%, 1)',
      dark: 'hsla(211, 0%, 77%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(211, 2%, 64%, 1)',
    },
    status: {
      border: 'hsla(211, 0%, 73%, 1)',
      background: 'hsla(211, 0%, 98%, 1)',
      lighter: 'hsla(211, 0%, 96%, 1)',
      light: 'hsla(211, 0%, 96%, 1)',
      main: 'hsla(211, 0%, 90%, 1)',
      dark: 'hsla(211, 0%, 77%, 1)',
      darker: 'hsla(211, 0%, 41%, 1)',
      secondaryText: 'hsla(211, 0%, 54%, 1)',
      contrastText: '#333',
      shadow: 'hsla(211, 2%, 64%, 1)',
    },
    // error: amber,
    error: {
      main: '#f2401b',
    },
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
};

export default {
  light: createMuiTheme(lightTheme),
  dark: createMuiTheme(darkTheme)
};
