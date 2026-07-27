import React, { useState } from 'react';
import { DocumentExtractResult, ExtractedMilestone } from '../types';
import { FileText, X, Check, Calendar, User, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  extractResult: DocumentExtractResult | null;
  onConfirmImport: (selectedMilestones: ExtractedMilestone[]) => void;
}

export const DocumentPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  extractResult,
  onConfirmImport,
}) => {
  const [milestones, setMilestones] = useState<ExtractedMilestone[]>(
    extractResult ? extractResult.extractedMilestones : []
  );

  React.useEffect(() => {
    if (extractResult) {
      setMilestones(extractResult.extractedMilestones);
    }
  }, [extractResult]);

  if (!isOpen || !extractResult) return null;

  const handleToggleSelect = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setMilestones((prev) => prev.map((m) => ({ ...m, selected: select })));
  };

  const selectedCount = milestones.filter((m) => m.selected).length;

  const handleConfirm = () => {
    const selected = milestones.filter((m) => m.selected);
    onConfirmImport(selected);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '820px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}>
              <FileText size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>標案/合約文件關鍵日期提取與比對預覽</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                來源檔案: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{extractResult.fileName}</span> ({extractResult.fileSize})
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: 600 }}>
            <Sparkles size={18} color="#2563eb" />
            AI 智能文件解析已自動偵測 <strong>{milestones.length}</strong> 項報告繳交死線與相關負責人
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleToggleSelectAll(true)}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              全選
            </button>
            <span style={{ color: '#94a3b8' }}>|</span>
            <button
              onClick={() => handleToggleSelectAll(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              取消全選
            </button>
          </div>
        </div>

        {/* Milestone List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => handleToggleSelect(m.id)}
              style={{
                background: m.selected ? '#eff6ff' : '#ffffff',
                border: m.selected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={m.selected}
                  onChange={() => handleToggleSelect(m.id)}
                  style={{ marginTop: '0.25rem', width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: m.selected ? '#0f172a' : '#334155', fontWeight: 600 }}>
                      {m.title}
                    </h4>
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '0.15rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      D + {m.dayOffset} 天 ({m.matchedDate})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                    內文依據: "{m.originalText}"
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {m.owners.map((owner) => (
                      <span key={owner} style={{ fontSize: '0.725rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        <User size={12} color="#4f46e5" /> {owner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            已選擇 <strong style={{ color: 'var(--accent-secondary)' }}>{selectedCount}</strong> / {milestones.length} 項里程碑
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              style={{ opacity: selectedCount === 0 ? 0.5 : 1 }}
            >
              <Check size={18} /> 匯入選取項目至里程碑規則
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
