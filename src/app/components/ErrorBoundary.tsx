import React from 'react';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import ErrorDialog from './ErrorDialog';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: error instanceof Error
        ? error
        : new Error(String(error)),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.log('Error catched at React boundary:', error, info);
  }

  handleClose = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <Box display="flex">
        <Box p={1}>
          <Typography variant="body1">Oops! Something went wrong.</Typography>
        </Box>
        <ErrorDialog
          error={error}
          onClose={this.handleClose}
          needReload
          title={undefined}
        />
      </Box>
    );
  }
}

export default ErrorBoundary;
