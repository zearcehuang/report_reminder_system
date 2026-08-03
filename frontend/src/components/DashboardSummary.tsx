import React, { memo } from 'react';
import { Project } from '../types';
import { Calendar, Layers, CheckCircle2, Sparkles } from 'lucide-react';

interface DashboardSummaryProps {
  activeProject: Project;
  totalMilestones: number;
  submittedCount: number;
  pendingCount: number;
  shiftedCount: number;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = memo(({
  activeProject,
  totalMilestones,
  submittedCount,
  pendingCount,
  shiftedCount,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
      <div className="glass-card stat-card">
        <div className="stat-card-label">當前開工日 (D-DAY)</div>
        <div className="stat-card-value">
          <Calendar size={22} color="var(--accent-secondary)" />
          {activeProject.dDay || '尚未指定'}
        </div>
        <div className="stat-card-sublabel">
          提前 <strong style={{ color: '#fbbf24' }}>{activeProject.advanceNoticeDays} 天</strong> 自動推播通知
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-card-label">已啟用履約報告數</div>
        <div className="stat-card-value">
          <Layers size={22} color="#818cf8" />
          {totalMilestones} 項 Slots
        </div>
        <div className="stat-card-sublabel">標準里程碑規則已載入</div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-card-label">繳交進度狀態</div>
        <div className="stat-card-value" style={{ color: '#34d399' }}>
          <CheckCircle2 size={22} color="#10b981" />
          {submittedCount} / {submittedCount + pendingCount} 已完成
        </div>
        <div className="stat-card-sublabel">
          剩餘 <strong style={{ color: '#fbbf24' }}>{pendingCount} 項</strong> 待履約報告
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-card-label">DGPA 休假順延調整</div>
        <div className="stat-card-value" style={{ color: '#c084fc' }}>
          <Sparkles size={22} color="#c084fc" />
          {shiftedCount} 項死線已順延
        </div>
        <div className="stat-card-sublabel">自動避開週休與政府辦公日曆</div>
      </div>
    </div>
  );
});
