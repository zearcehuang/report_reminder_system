import React, { useState } from 'react';
import { ScheduleItem, Project } from '../types';
import { Clock, CheckCircle2, AlertTriangle, Send, Calendar, User, Search, ShieldAlert, Sparkles, Filter, RotateCcw } from 'lucide-react';
import { TeamsCardModal } from './TeamsCardModal';

interface Props {
  project: Project;
  schedules: ScheduleItem[];
  onToggleSubmitted: (scheduleId: string, isCompleted: boolean) => Promise<void>;
  onRefreshSchedules: () => void;
}

export const ScheduleTimeline: React.FC<Props> = ({
  project,
  schedules,
  onToggleSubmitted,
  onRefreshSchedules,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedScheduleForTeams, setSelectedScheduleForTeams] = useState<ScheduleItem | null>(null);

  // Filtered schedules
  const filtered = schedules.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owners.some((o) => o.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'Submitted':
        return <span className="badge badge-submitted"><CheckCircle2 size={13} /> 已繳交驗收</span>;
      case 'Sent':
        return <span className="badge badge-sent"><Send size={13} /> 已發送提醒</span>;
      case 'Failed':
        return <span className="badge badge-failed"><AlertTriangle size={13} /> 發送失敗</span>;
      default:
        return <span className="badge badge-pending"><Clock size={13} /> 等待繳交 (Pending)</span>;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.55rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}>
            <Calendar size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>專案履約報告繳交時間軸 (Schedule Timeline)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              依行政院人事行政總處 (DGPA) 辦公日曆自動避開例假日與國定假日
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="搜尋報告名稱/負責人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.9)', border: '1px solid rgba(203, 213, 225, 0.8)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
            {['ALL', 'Pending', 'Sent', 'Submitted'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                  border: 'none',
                  color: statusFilter === st ? '#4f46e5' : 'var(--text-secondary)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: statusFilter === st ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? '全部' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline List */}
      {filtered.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
          {/* Vertical line indicator */}
          <div style={{
            position: 'absolute',
            left: '0.5rem',
            top: '1rem',
            bottom: '1rem',
            width: '2px',
            background: 'linear-gradient(180deg, #4f46e5 0%, #0284c7 100%)',
            borderRadius: '2px',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  border: '1px solid var(--surface-glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1.2fr 1fr auto',
                  gap: '1.25rem',
                  alignItems: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="timeline-card-hover"
              >
                {/* Timeline node dot */}
                <div style={{
                  position: 'absolute',
                  left: '-1.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: item.status === 'Submitted' ? '#10b981' : item.wasShiftedByHoliday ? '#9333ea' : '#4f46e5',
                  border: '3px solid #ffffff',
                  boxShadow: item.status === 'Submitted' ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(79, 70, 229, 0.4)',
                }} />

                {/* Left: Milestone Title & Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      background: 'rgba(79, 70, 229, 0.12)',
                      color: '#4f46e5',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      D + {item.dDayOffset} 天
                    </span>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.title}</h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={13} color="#64748b" /> {item.owners.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Middle: Calculated Date & Holiday Shift Badge */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>死線日期:</span>
                    <strong style={{ fontSize: '1rem', color: item.wasShiftedByHoliday ? '#9333ea' : 'var(--text-primary)' }}>
                      {item.calculatedDate}
                    </strong>
                  </div>

                  {item.wasShiftedByHoliday ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="badge badge-holiday" style={{ fontSize: '0.7rem' }}>
                        <ShieldAlert size={11} /> 因 {item.holidayName} 避開假日順延
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      工作日無休假衝突
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  {getStatusBadge(item.status)}
                  {item.submittedAt && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      於 {new Date(item.submittedAt).toLocaleDateString()} 完成
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {item.status === 'Submitted' ? (
                    <button
                      className="btn-secondary"
                      onClick={() => onToggleSubmitted(item.id, false)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        borderColor: '#fca5a5',
                        color: '#dc2626',
                        background: '#fef2f2',
                      }}
                      title="取消已繳交狀態，還原為等待繳交 (Pending)"
                    >
                      <RotateCcw size={14} /> 改為未繳交
                    </button>
                  ) : (
                    <button
                      className="btn-success"
                      onClick={() => onToggleSubmitted(item.id, true)}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      title="手動標記此報告已完成繳交並通過驗收"
                    >
                      <CheckCircle2 size={15} /> 標記為已繳交
                    </button>
                  )}

                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedScheduleForTeams(item)}
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'rgba(91, 95, 199, 0.15)', borderColor: 'rgba(91, 95, 199, 0.3)' }}
                    title="預覽 MS Teams 卡片並進行發送測試"
                  >
                    <Send size={15} color="#818cf8" /> Teams 測試發送
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p>尚無符合篩選條件的報告繳交時間軸</p>
        </div>
      )}

      {/* Teams Adaptive Card Modal */}
      <TeamsCardModal
        isOpen={!!selectedScheduleForTeams}
        onClose={() => setSelectedScheduleForTeams(null)}
        scheduleItem={selectedScheduleForTeams}
        project={project}
        onNotificationSent={() => {
          onRefreshSchedules();
        }}
      />
    </div>
  );
};
