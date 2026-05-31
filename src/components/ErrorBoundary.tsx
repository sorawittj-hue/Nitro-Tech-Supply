import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '440px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{
              color: '#f87171',
              fontFamily: 'var(--font-mono, "Fira Code", monospace)',
              fontSize: '18px',
              marginBottom: '12px',
              fontWeight: 600,
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <details style={{
              textAlign: 'left',
              marginBottom: '20px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}>
              <summary style={{
                color: 'var(--accent-cyan, #22d3ee)',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}>
                Component Stack
              </summary>
              <pre style={{
                color: '#fbbf24',
                fontSize: '11px',
                overflow: 'auto',
                maxHeight: '180px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginTop: '8px',
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 28px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
