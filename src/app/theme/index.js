import { createMuiTheme } from '@material-ui/core/styles';
// import amber from '@material-ui/core/colors/amber';
// import grey from '@material-ui/core/colors/grey';

// const darkTheme = {
//   palette: {
//     type: 'dark',
//     primary: {
//       main: amber[500],
//       contrastText: '#fff',
//     },
//     secondary: {
//       main: grey[500],
//       // main: '#4E293A',
//       contrastText: '#fff',
//     },
//     // primary: amber,
//     // secondary: teal,
//     model: {
//       // light: '#6E495A',
//       light: 'hsla(332, 31%, 29%, 1)',
//       main: 'hsla(332, 31%, 23%, 1)',
//       // dark: '#2C0718',
//       dark: 'hsla(332, 31%, 17%, 1)',
//       // darker: '#1C0008',
//       darker: 'hsla(332, 31%, 11%, 1)',
//       secondaryText: 'hsla(332, 9%, 54%, 1)',
//     },
//     input: {
//       // light: '#5B6E4D',
//       light: 'hsla(95, 27%, 29%, 1)',
//       // main: '#3B4E2D',
//       main: 'hsla(95, 27%, 23%, 1)',
//       // dark: '#192C0B',
//       dark: 'hsla(95, 27%, 17%, 1)',
//       // darker: '#091C00',
//       darker: 'hsla(95, 27%, 11%, 1)',
//       secondaryText: 'hsla(95, 9%, 54%, 1)',
//     },
//     output: {
//       // light: '#435262',
//       light: 'hsla(211, 31%, 29%, 1)',
//       // main: '#233242',
//       main: 'hsla(211, 31%, 23%, 1)',
//       // dark: '#011020',
//       dark: 'hsla(211, 31%, 17%, 1)',
//       // darker: '#000010',
//       darker: 'hsla(211, 31%, 11%, 1)',
//     },
//     // error: amber,
//     error: {
//       main: '#f2401b',
//     },
//     // Used by `getContrastText()` to maximize the contrast between the background and
//     // the text.
//     contrastThreshold: 3,
//     // Used by the functions below to shift a color's luminance by approximately
//     // two indexes within its tonal palette.
//     // E.g., shift from Red 500 to Red 300 or Red 700.
//     tonalOffset: 0.2
//   },
//   // Migration to typography v2
//   typography: {
//     useNextVariants: true
//   }
// };

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
    console: {
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


const theme = createMuiTheme(lightTheme);

export default theme;
