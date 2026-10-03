import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ClimateLens ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px',
            margin: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 9999,
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '16px' }}>
            ⚠️ {this.props.fallbackTitle || 'A component encountered an issue'}
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#cbd5e1' }}>
            {this.state.error?.message || 'Unexpected application error.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Try reloading component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
