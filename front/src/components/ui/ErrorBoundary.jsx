import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '600px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#f87171',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-secondary))', marginBottom: '1.5rem' }}>
            An unexpected error occurred while rendering this component.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
