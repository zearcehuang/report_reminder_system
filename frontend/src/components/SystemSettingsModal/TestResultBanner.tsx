import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { GeminiTestResult } from '../../types';

interface TestResultBannerProps {
  testResult: GeminiTestResult;
}

export const TestResultBanner: React.FC<TestResultBannerProps> = ({ testResult }) => {
  return (
    <div
      className="animate-fade-in"
      style={{
        background: testResult.success ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        fontSize: '0.825rem',
      }}
    >
      {testResult.success ? (
        <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
      )}
      <div>
        <div style={{ fontWeight: 700, color: testResult.success ? '#15803d' : '#b91c1c' }}>
          {testResult.success ? '✅ API 連線測試成功' : '❌ API 連線失敗'}
        </div>
        <div
          style={{
            color: testResult.success ? '#166534' : '#991b1b',
            marginTop: '2px',
            fontSize: '0.775rem',
          }}
        >
          {testResult.message || testResult.error}
        </div>
        {testResult.latencyMs !== undefined && (
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            ⚡ 往返延遲:{' '}
            <span style={{ fontWeight: 700, color: '#334155' }}>{testResult.latencyMs} ms</span> |
            測試模型: {testResult.model}
          </div>
        )}
      </div>
    </div>
  );
};
