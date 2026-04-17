import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
    this.setState({ componentStack: info?.componentStack || null });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.state.error?.message ||
      (typeof this.state.error === 'string' ? this.state.error : 'Something went wrong.');
    const stack = this.state.error?.stack || null;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-extrabold text-gray-900">App error</h1>
          <p className="text-sm text-gray-600 mt-2">
            A page crashed while rendering. Use the details below to fix it.
          </p>

          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="text-sm font-bold text-red-800">Error message</div>
            <div className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{message}</div>
          </div>

          {(stack || this.state.componentStack) && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-sm font-bold text-gray-800">Stack trace</div>
              <pre className="text-xs text-gray-700 mt-2 whitespace-pre-wrap break-words">
                {stack || '—'}
              </pre>
              {this.state.componentStack && (
                <>
                  <div className="text-sm font-bold text-gray-800 mt-4">Component stack</div>
                  <pre className="text-xs text-gray-700 mt-2 whitespace-pre-wrap break-words">
                    {this.state.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

