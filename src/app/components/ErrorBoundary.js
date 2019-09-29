import React from 'react';
import { Box } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import ErrorDialog from './ErrorDialog';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.log('Error catched at React boundary:', error, info);
  }

  handleClose = () => {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    // const error = new Error(`Minified React error #31; visit https://reactjs.org/docs/error-decoder.html?invariant=31&args[]=object%20with%20keys%20%7Bcmd%2C%20code%2C%20killed%2C%20message%2C%20name%2C%20signal%2C%20stack%2C%20stderr%2C%20stdout%7D&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
    if (!error) {
      return this.props.children;
    }

    return (
      <Box display="flex">
        <Box p={1}>
          <Typography variant="body1">Oops! Something went wrong.</Typography>
        </Box>
        <ErrorDialog error={error} onClose={this.handleClose} needReload/>
      </Box>
    );
  }
}

export default ErrorBoundary;
