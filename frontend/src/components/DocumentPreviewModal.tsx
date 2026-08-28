import React, { useState } from 'react';
import { DocumentExtractResult, ExtractedMilestone } from '../types';
import { FileText, X, Check, Calendar, User, Sparkles, Scale, Package, BookOpen, ChevronDown, ChevronUp, Layers, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  extractResult: DocumentExtractResult | null;
  onConfirmImport: (selectedMilestones: ExtractedMilestone[]) => void;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '啟動籌備': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  '需求分析': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  '系統設計': { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  '系統開發': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  '期中審查': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  '測試驗收': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  '期末結案': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  '維護保固': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  '定期進度報告': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
};

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
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  React.useEffect(() => {
    if (extractResult) {
      setMilestones(extractResult.extractedMilestones);
      // Auto expand first 2 cards
      const initialExpanded: Record<string, boolean> = {};
      extractResult.extractedMilestones.slice(0, 2).forEach(m => {
        initialExpanded[m.id] = true;
      });
      setExpandedCards(initialExpanded);
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
    setMilestones((prev) =>
      prev.map((m) => {
        if (selectedStageFilter === 'all' || m.stage === selectedStageFilter) {
          return { ...m, selected: select };
        }
        return m;
      })
    );
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const stages = Array.from(new Set(milestones.map(m => m.stage).filter(Boolean))) as string[];

  const filteredMilestones = selectedStageFilter === 'all'
    ? milestones
    : milestones.filter(m => m.stage === selectedStageFilter);

  const selectedCount = milestones.filter((m) => m.selected).length;

  const handleConfirm = () => {
    const selected = milestones.filter((m) => m.selected);
    onConfirmImport(selected);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '900px', padding: '1.75rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI 標案合約文件深度解析與五維度比對預覽
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                來源檔案: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{extractResult.fileName}</span> ({extractResult.fileSize})
                {extractResult.source && <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>• 引擎: {extractResult.source}</span>}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Info Banner & Stage Filters */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.825rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3730a3', fontWeight: 600 }}>
              <Sparkles size={18} color="#4f46e5" />
              已萃取五維度結構化欄位（D+N 天數、📦 交付產出物、⚖️ 違約罰則與 📜 條文依據）
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

          {/* Stage Filter Buttons */}
          {stages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px solid #c7d2fe' }}>
              <span style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Layers size={13} /> 階段篩選:
              </span>
              <button
                onClick={() => setSelectedStageFilter('all')}
                style={{
                  fontSize: '0.725rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  border: selectedStageFilter === 'all' ? '1px solid #4f46e5' : '1px solid #c7d2fe',
                  background: selectedStageFilter === 'all' ? '#4f46e5' : '#ffffff',
                  color: selectedStageFilter === 'all' ? '#ffffff' : '#4338ca',
                  cursor: 'pointer',
                  fontWeight: selectedStageFilter === 'all' ? 700 : 500
                }}
              >
                全部 ({milestones.length})
              </button>
              {stages.map(stage => {
                const count = milestones.filter(m => m.stage === stage).length;
                const isSelected = selectedStageFilter === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setSelectedStageFilter(stage)}
                    style={{
                      fontSize: '0.725rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      border: isSelected ? '1px solid #4f46e5' : '1px solid #c7d2fe',
                      background: isSelected ? '#4f46e5' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#4338ca',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    {stage} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestone List */}
        {filteredMilestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed #cbd5e1' }}>
            <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>未符合篩選條件的里程碑項目</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              請切換至「全部」或其他階段分類檢視解析結果。
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.35rem' }}>
            {filteredMilestones.map((m) => {
              const isExpanded = !!expandedCards[m.id];
              const deliverables = m.deliverables || [`${m.title} 文檔成果報告書`, '成果驗收清冊'];
              const penaltyTerms = m.penaltyTerms || '逾期每日按本案合約總價千分之一計罰違約金';
              const clauseRef = m.clauseReference || '參照標案需求說明書 (RFP) 履約規定';
              const stageStyle = STAGE_COLORS[m.stage || ''] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

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
                      style={{ marginTop: '0.35rem', width: '17px', height: '17px', accentColor: '#4f46e5', cursor: 'pointer' }}
                    />

                    <div style={{ flex: 1 }}>
                      {/* Top Row: Title + Stage + DayOffset + Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
                          {m.stage && (
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: stageStyle.bg,
                              color: stageStyle.text,
                              border: `1px solid ${stageStyle.border}`,
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}>
                              {m.stage}
                            </span>
                          )}
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
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Day Offset Badge */}
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
                            gap: '0.25rem'
                          }}>
                            <Clock size={12} color="#4f46e5" />
                            D + <input
                                  type="number"
                                  value={m.dayOffset ?? 0}
                                  onChange={(e) => handleUpdateMilestone(m.id, 'dayOffset', parseInt(e.target.value) || 0)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: '42px', background: 'transparent', border: 'none', borderBottom: '1px dashed #818cf8', color: '#3730a3', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                                />
                            <span>{m.dayType === 'workday' ? '工作天' : '日曆天'}</span>
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

                      {/* Snippet / Original Text */}
                      <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.45rem', fontStyle: 'italic' }}>
                        {m.originalText || (m as any).contextSnippet || m.title || ''}
                      </p>

                      {/* Badges Bar */}
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: isExpanded ? '0.65rem' : '0' }}>
                        {m.location && (
                          <span style={{ fontSize: '0.7rem', color: '#4338ca', fontWeight: 600, background: '#e0e7ff', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                            📍 {m.location}
                          </span>
                        )}

                        {m.source?.includes('gemini') ? (
                          <span style={{
                            fontSize: '0.7rem',
                            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 700
                          }}>
                            <Sparkles size={11} color="#6366f1" />
                            Gemini AI ({m.confidence || 96}%)
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600
                          }}>
                            ⚡ 啟發式規則 ({m.confidence || 85}%)
                          </span>
                        )}

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
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#15803d', fontWeight: 700, marginBottom: '0.3rem' }}>
                              <Package size={14} /> 📦 交付產出物清單 (Deliverables):
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {deliverables.map((item, idx) => (
                                <span key={idx} style={{ background: '#ffffff', border: '1px solid #86efac', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Penalty Terms */}
                          <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#b45309', fontWeight: 700, marginBottom: '0.2rem' }}>
                              <Scale size={14} /> ⚖️ 逾期違約罰則 (Penalty Terms):
                            </div>
                            <textarea
                              value={penaltyTerms}
                              onChange={(e) => handleUpdateMilestone(m.id, 'penaltyTerms', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              rows={2}
                              style={{
                                color: '#78350f',
                                fontWeight: 600,
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid transparent',
                                borderBottom: '1px dashed #fcd34d',
                                resize: 'none',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Clause Reference */}
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BookOpen size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>📜 條文依據:</span>
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
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <Check size={18} /> 匯入選取項目至里程碑規則 ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
