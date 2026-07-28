import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../services/logger';
import { AlertOctagon, RotateCcw, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLogger.log('REACT_RENDER', 'ERROR', error.message, error.stack, { componentStack: errorInfo.componentStack });
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#090d16',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.65rem', borderRadius: '10px' }}>
                <AlertOctagon size={28} color="#ef4444" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', margin: 0 }}>畫面渲染發生異常 (React Error)</h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                  系統已阻斷全白畫面 crash 並自動記錄 Error Log
                </p>
              </div>
            </div>

            <div style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.875rem',
              color: '#fca5a5',
              fontFamily: 'monospace',
              marginBottom: '1.25rem',
              wordBreak: 'break-word',
            }}>
              ❌ Error: {this.state.error?.message || '未知前端渲染錯誤'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {this.state.showDetails ? '隱藏詳細 Stack Trace' : '顯示詳細 Stack Trace'}
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
                }}
              >
                <RotateCcw size={16} /> 重新載入系統
              </button>
            </div>

            {this.state.showDetails && (
              <pre style={{
                background: '#020617',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#cbd5e1',
                maxHeight: '240px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                border: '1px solid #1e293b'
              }}>
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
