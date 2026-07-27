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
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc' }}>
            <Sparkles size={18} color="#818cf8" />
            AI 智能文件解析已自動偵測 <strong>{milestones.length}</strong> 項報告繳交死線與相關負責人
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleToggleSelectAll(true)}
              style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              全選
            </button>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <button
              onClick={() => handleToggleSelectAll(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
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
                background: m.selected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: m.selected ? '1px solid var(--accent-primary)' : '1px solid var(--surface-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
                    <h4 style={{ fontSize: '0.95rem', color: m.selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {m.title}
                    </h4>
                    <span style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: 'var(--accent-secondary)',
                      padding: '0.15rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}>
                      D + {m.dayOffset} 天 ({m.matchedDate})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                    內文依據: "{m.originalText}"
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {m.owners.map((owner) => (
                      <span key={owner} style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <User size={12} /> {owner}
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
