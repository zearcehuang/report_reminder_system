import React, { useState } from 'react';
import { DocumentExtractResult, ExtractedMilestone } from '../types';
import { FileText, X, Check, Calendar, User, Sparkles, Scale, Package, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (extractResult) {
      setMilestones(extractResult.extractedMilestones);
      // Auto expand first card
      if (extractResult.extractedMilestones.length > 0) {
        setExpandedCards({ [extractResult.extractedMilestones[0].id]: true });
      }
    }
  }, [extractResult]);

  if (!isOpen || !extractResult) return null;

  const handleToggleSelect = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleUpdateMilestone = (id: string, field: keyof ExtractedMilestone, value: any) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setMilestones((prev) => prev.map((m) => ({ ...m, selected: select })));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = milestones.filter((m) => m.selected).length;

  const handleConfirm = () => {
    const selected = milestones.filter((m) => m.selected);
    onConfirmImport(selected);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '860px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}>
              <FileText size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>AI 標案合約文件深度解析與五維度比對預覽</h2>
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
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3730a3', fontWeight: 600 }}>
            <Sparkles size={18} color="#4f46e5" />
            AI 已成功解讀五維度結構化欄位（含死線天數、📦 交付產出物、⚖️ 罰則條文與 📜 條文索引）
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleToggleSelectAll(true)}
              style={{ background: 'transparent', border: 'none', color: '#4338ca', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
            >
              全選
            </button>
            <span style={{ color: '#a5b4fc' }}>|</span>
            <button
              onClick={() => handleToggleSelectAll(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              取消全選
            </button>
          </div>
        </div>

        {/* Milestone List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {milestones.map((m) => {
            const isExpanded = !!expandedCards[m.id];
            const deliverables = m.deliverables || [`${m.title} 文檔檔案`, '成果驗收清冊'];
            const penaltyTerms = m.penaltyTerms || '逾期每日按本案合約總價千分之一計罰違約金';
            const clauseRef = m.clauseReference || '參照標案需求說明書 (RFP) 履約規定';

            return (
              <div
                key={m.id}
                onClick={() => handleToggleSelect(m.id)}
                style={{
                  background: m.selected ? '#ffffff' : '#f8fafc',
                  border: m.selected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1.15rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: m.selected ? '0 4px 12px rgba(79, 70, 229, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={m.selected}
                    onChange={() => handleToggleSelect(m.id)}
                    style={{ marginTop: '0.25rem', width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <input 
                        type="text" 
                        value={m.title} 
                        onChange={(e) => handleUpdateMilestone(m.id, 'title', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          fontSize: '0.95rem', 
                          color: m.selected ? '#0f172a' : '#334155', 
                          fontWeight: 700, 
                          border: '1px solid transparent',
                          borderBottom: '1px dashed #cbd5e1',
                          background: 'transparent',
                          width: '100%',
                          maxWidth: '300px',
                          outline: 'none'
                        }} 
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '0.15rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          D + <input 
                                type="number" 
                                value={m.dayOffset ?? 0}
                                onChange={(e) => handleUpdateMilestone(m.id, 'dayOffset', parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '40px', background: 'transparent', border: 'none', borderBottom: '1px dashed #818cf8', color: '#3730a3', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                              /> 天 ({m.matchedDate || (m as any).date || '未指定死線'})
                        </span>
                        <button
                          className="btn-icon"
                          onClick={(e) => toggleExpand(m.id, e)}
                          style={{ padding: '0.2rem' }}
                          title={isExpanded ? "折疊五維度合約細節" : "展開五維度合約細節"}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                      原始條文: "{m.originalText || (m as any).contextSnippet || m.title || ''}"
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: isExpanded ? '0.65rem' : '0' }}>
                      {(m.owners || ['張小明 (PM)']).map((owner) => (
                        <span key={owner} style={{ fontSize: '0.725rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          <User size={12} color="#4f46e5" /> {owner}
                        </span>
                      ))}
                    </div>

                    {/* Collapsible 5D Contract Details */}
                    {isExpanded && (
                      <div className="animate-fade-in" style={{
                        marginTop: '0.65rem',
                        paddingTop: '0.65rem',
                        borderTop: '1px dashed #cbd5e1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: '0.775rem'
                      }}>
                        {/* Deliverables */}
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#15803d', fontWeight: 700, marginBottom: '0.25rem' }}>
                            <Package size={14} /> 📦 交付產出物清單 (Deliverables):
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {deliverables.map((item, idx) => (
                              <span key={idx} style={{ background: '#ffffff', border: '1px solid #86efac', color: '#166534', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Penalty Terms */}
                        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#b45309', fontWeight: 700, marginBottom: '0.15rem' }}>
                            <Scale size={14} /> ⚖️ 逾期違約罰則 (Penalty Terms):
                          </div>
                          <textarea
                            value={penaltyTerms}
                            onChange={(e) => handleUpdateMilestone(m.id, 'penaltyTerms', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              color: '#78350f', 
                              fontWeight: 600,
                              width: '100%',
                              background: 'transparent',
                              border: '1px solid transparent',
                              borderBottom: '1px dashed #fcd34d',
                              resize: 'none',
                              outline: 'none',
                              minHeight: '2.5rem'
                            }}
                          />
                        </div>

                        {/* Clause Reference */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <BookOpen size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>📜 條文依據:</span>
                          <input 
                            type="text" 
                            value={clauseRef}
                            onChange={(e) => handleUpdateMilestone(m.id, 'clauseReference', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              color: '#334155', 
                              fontWeight: 600,
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed #cbd5e1',
                              width: '100%',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            已選擇 <strong style={{ color: 'var(--accent-secondary)' }}>{selectedCount}</strong> / {milestones.length} 項合約里程碑
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
