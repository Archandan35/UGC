import { Component } from "react";

/**
 * App-wide error boundary. Catches any render-time error in the React
 * tree below it, logs it, and shows a friendly fallback with a retry
 * button instead of a white screen. Keep the JSX minimal — all styles
 * live in global.css (`.error-boundary`, `.error-boundary__panel`).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary__panel card">
          <h1>Something went wrong</h1>
          <p>
            An unexpected error occurred. You can try again, or reload the
            page if the problem persists.
          </p>
          <pre className="error-boundary__message">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="error-boundary__actions">
            <button className="btn-primary" onClick={this.handleReset}>
              Try again
            </button>
            <button className="btn-secondary" onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
