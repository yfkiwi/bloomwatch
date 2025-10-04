import React from 'react';

/**
 * Error Boundary class component to catch and handle React component errors
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {Function} props.onError - Optional callback when error occurs
 * @returns {JSX.Element} ErrorBoundary component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    // Reload the entire page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 text-center">
              {/* Error Icon */}
              <div className="text-red-500 text-6xl mb-4">
                ⚠️
              </div>
              
              {/* Error Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h2>
              
              {/* Error Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                We encountered an unexpected error while loading this content. 
                This might be a temporary issue.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-bloom-600 text-white rounded-lg hover:bg-bloom-700 transition-colors duration-200 font-medium"
                >
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Reload Page
                </button>
              </div>
              
              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-700 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            {/* Help Text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                If this problem persists, please check your internet connection or try again later.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
