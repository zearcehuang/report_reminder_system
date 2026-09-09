import React, { useState, useEffect } from 'react';
import { DocumentExtractResult, ExtractedMilestone } from '../types';
import { FileText, X, Check } from 'lucide-react';
import { StageFilterBar } from './DocumentPreviewModal/StageFilterBar';
import { MilestoneCard } from './DocumentPreviewModal/MilestoneCard';

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
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  useEffect(() => {
    if (extractResult) {
      setMilestones(extractResult.extractedMilestones);
      // Auto expand first 2 cards
      const initialExpanded: Record<string, boolean> = {};
      extractResult.extractedMilestones.slice(0, 2).forEach((m) => {
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

  const handleUpdateMilestone = <K extends keyof ExtractedMilestone>(
    id: string,
    field: K,
    value: ExtractedMilestone[K]
  ) => {
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
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const stages = Array.from(
    new Set(milestones.map((m) => m.stage).filter(Boolean))
  ) as string[];

  const filteredMilestones =
    selectedStageFilter === 'all'
      ? milestones
      : milestones.filter((m) => m.stage === selectedStageFilter);

  const selectedCount = milestones.filter((m) => m.selected).length;

  const handleConfirm = () => {
    const selected = milestones.filter((m) => m.selected);
    onConfirmImport(selected);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-modal width-full"
        style={{
          maxWidth: '900px',
          padding: '1.75rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              }}
            >
              <FileText size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI 標案合約文件深度解析與五維度比對預覽
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                來源檔案:{' '}
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                  {extractResult.fileName}
                </span>{' '}
                ({extractResult.fileSize})
                {extractResult.source && (
                  <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                    • 引擎: {extractResult.source}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Info Banner & Stage Filters */}
        <StageFilterBar
          stages={stages}
          selectedStageFilter={selectedStageFilter}
          milestones={milestones}
          onSelectStage={setSelectedStageFilter}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Milestone List */}
        {filteredMilestones.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #cbd5e1',
            }}
          >
            <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>未符合篩選條件的里程碑項目</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              請切換至「全部」或其他階段分類檢視解析結果。
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '0.35rem',
            }}
          >
            {filteredMilestones.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                isExpanded={!!expandedCards[m.id]}
                onToggleSelect={() => handleToggleSelect(m.id)}
                onToggleExpand={(e) => toggleExpand(m.id, e)}
                onUpdate={(field, val) => handleUpdateMilestone(m.id, field, val)}
              />
            ))}
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            已選擇 <strong style={{ color: 'var(--accent-secondary)' }}>{selectedCount}</strong> /{' '}
            {milestones.length} 項合約里程碑
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
