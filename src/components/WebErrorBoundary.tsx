import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null; info: React.ErrorInfo | null };

/**
 * Renders any thrown error directly into the page so we can debug web
 * without DevTools. Falls through to children when there is no error.
 */
export class WebErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    if (typeof console !== 'undefined') {
      console.error('[FlavorFlow] runtime error:', error);
      if (info?.componentStack) console.error(info.componentStack);
    }
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          padding: 24,
          backgroundColor: '#0f172a',
          color: '#fee2e2',
          minHeight: '100vh',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        <h1 style={{ color: '#fca5a5', marginTop: 0 }}>FlavorFlow crashed</h1>
        <p style={{ color: '#fecaca' }}>
          {error.name}: {error.message}
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#1e293b',
            padding: 14,
            borderRadius: 8,
            border: '1px solid #334155',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {error.stack}
        </pre>
        {info?.componentStack ? (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#1e293b',
              padding: 14,
              borderRadius: 8,
              border: '1px solid #334155',
              fontSize: 12,
              lineHeight: 1.5,
              marginTop: 12,
            }}
          >
            {info.componentStack}
          </pre>
        ) : null}
      </div>
    );
  }
}
