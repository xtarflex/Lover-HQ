import React from 'react';
import * as Sentry from '@sentry/react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);

    // Send to error tracking service
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo?.componentStack } },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50 text-red-900">
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <details className="whitespace-pre-wrap text-sm text-left bg-white p-4 rounded shadow-md w-full max-w-2xl overflow-auto">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
