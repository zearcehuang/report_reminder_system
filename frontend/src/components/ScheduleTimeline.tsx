import React, { useState, memo } from 'react';
import { ScheduleItem, Project } from '../types';
import { Clock, CheckCircle2, AlertTriangle, Send, Calendar, User, Search, ShieldAlert, Sparkles, Filter, RotateCcw, Trash2, FilePlus, Edit3 } from 'lucide-react';
import { OutlookMeetingModal } from './OutlookMeetingModal';
import { useToast } from '../hooks/useToast';

interface Props {
  project: Project;
  schedules: ScheduleItem[];
  onToggleSubmitted: (scheduleId: string, isCompleted: boolean) => Promise<void>;
  onRefreshSchedules: () => void;
  onDeleteSchedule?: (scheduleId: string) => Promise<void>;
  onBatchDeleteSchedules?: (scheduleIds: string[]) => Promise<void>;
  onOpenAddReportModal?: () => void;
  onEditScheduleDate?: (scheduleItem: ScheduleItem) => void;
}

export const ScheduleTimeline: React.FC<Props> = memo(({
  project,
  schedules,
  onToggleSubmitted,
  onRefreshSchedules,
  onDeleteSchedule,
  onBatchDeleteSchedules,
  onOpenAddReportModal,
  onEditScheduleDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedScheduleForOutlook, setSelectedScheduleForOutlook] = useState<ScheduleItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Filtered schedules
  const filtered = schedules.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owners.some((o) => o.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const handleDeleteSingle = async (item: ScheduleItem) => {
    toast.confirm(
      '刪除履約項目',
      `確定要刪除「${item.title}」此履約報告繳交項目嗎？此動作無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          if (onDeleteSchedule) {
            await onDeleteSchedule(item.id);
            toast.success(`成功刪除 ${item.title}`);
          }
          setSelectedIds(selectedIds.filter(id => id !== item.id));
        } catch (err: any) {
          toast.error(err.message || '刪除失敗');
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    toast.confirm(
      '批次刪除',
      `確定要刪除選取的 ${selectedIds.length} 個履約報告繳交項目嗎？此動作無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          if (onBatchDeleteSchedules) {
            await onBatchDeleteSchedules(selectedIds);
            toast.success(`成功刪除 ${selectedIds.length} 筆項目`);
          }
          setSelectedIds([]);
        } catch (err: any) {
          toast.error(err.message || '批次刪除失敗');
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
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
          {onOpenAddReportModal && (
            <button
              onClick={onOpenAddReportModal}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="手動新增履約報告"
            >
              <FilePlus size={15} /> 新增履約報告
            </button>
          )}

          <div style={{ position: 'relative', width: '200px' }}>
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

      {/* Batch Select Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        padding: '0.55rem 0.85rem',
        background: '#f8fafc',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid #e2e8f0',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: '#334155' }}>
          <input
            type="checkbox"
            checked={filtered.length > 0 && filtered.every(s => selectedIds.includes(s.id))}
            onChange={() => {
              if (filtered.every(s => selectedIds.includes(s.id))) {
                setSelectedIds(selectedIds.filter(id => !filtered.some(f => f.id === id)));
              } else {
                const allFilteredIds = filtered.map(s => s.id);
                const combined = Array.from(new Set([...selectedIds, ...allFilteredIds]));
                setSelectedIds(combined);
              }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          全選報告項目 ({selectedIds.length}/{filtered.length})
        </label>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={isDeleting}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 1px 2px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={14} /> 批次刪除 ({selectedIds.length})
          </button>
        )}
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
            {filtered.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    background: isSelected ? '#fff1f2' : '#ffffff',
                    border: isSelected ? '2px solid #f43f5e' : '1px solid var(--surface-glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1.8fr 1.2fr 1fr auto',
                    gap: '1.25rem',
                    alignItems: 'center',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="timeline-card-hover"
                >
                  {/* Checkbox for batch select */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedIds(selectedIds.filter(id => id !== item.id));
                        } else {
                          setSelectedIds([...selectedIds, item.id]);
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

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

                    {item.deliverables && item.deliverables.length > 0 && (
                      <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {item.deliverables.slice(0, 3).map((deliv, i) => (
                          <span key={i} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.7rem', padding: '0.05rem 0.35rem', borderRadius: '3px', fontWeight: 600 }}>
                            📦 {deliv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Middle: Calculated Date & Holiday Shift Badge */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>死線日期:</span>
                      <strong style={{ fontSize: '1rem', color: item.wasShiftedByHoliday ? '#9333ea' : 'var(--text-primary)' }}>
                        {item.calculatedDate}
                      </strong>
                      {onEditScheduleDate && (
                        <button
                          type="button"
                          onClick={() => onEditScheduleDate(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#4f46e5',
                            cursor: 'pointer',
                            padding: '0.1rem 0.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="修改此履約報告死線日期"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Multi-Notice Dates Summary */}
                    {(() => {
                      const daysList = (item.advanceNoticeDaysList && item.advanceNoticeDaysList.length > 0)
                        ? item.advanceNoticeDaysList
                        : [item.advanceNoticeDays || 3];
                      
                      const noticePills = daysList.sort((a, b) => b - a).map(days => {
                        const d = new Date(item.calculatedDate);
                        d.setDate(d.getDate() - days);
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${days}天前(${mm}/${dd})`;
                      });

                      return (
                        <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {item.wasShiftedByHoliday && (
                            <span className="badge badge-holiday" style={{ fontSize: '0.7rem', display: 'inline-flex', width: 'fit-content' }}>
                              <ShieldAlert size={11} /> 因 {item.holidayName} 避開假日順延
                            </span>
                          )}
                          <span style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={11} color="#2563eb" /> 預警天數: {noticePills.join(' • ')}
                          </span>
                        </div>
                      );
                    })()}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {onEditScheduleDate && (
                      <button
                        className="btn-secondary"
                        onClick={() => onEditScheduleDate(item)}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', borderColor: '#c7d2fe', color: '#3730a3', background: '#e0e7ff' }}
                        title="修改此履約報告的死線日期與詳細內容"
                      >
                        <Edit3 size={14} /> 修改日期
                      </button>
                    )}

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
                      onClick={() => setSelectedScheduleForOutlook(item)}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'rgba(0, 120, 212, 0.12)', borderColor: 'rgba(0, 120, 212, 0.3)', color: '#005a9e' }}
                      title="發布 Outlook 會議預約信件與下載 .ics 會議檔"
                    >
                      <Calendar size={15} color="#0078d4" /> 發布 Outlook 會議
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleDeleteSingle(item)}
                      disabled={isDeleting}
                      style={{
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        borderColor: '#fee2e2',
                        color: '#ef4444',
                        background: '#fef2f2',
                        cursor: 'pointer',
                      }}
                      title="刪除此履約報告繳交項目"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p>尚無符合篩選條件的報告繳交時間軸</p>
        </div>
      )}

      {/* Outlook Meeting Publisher & Download Modal */}
      <OutlookMeetingModal
        isOpen={!!selectedScheduleForOutlook}
        onClose={() => setSelectedScheduleForOutlook(null)}
        scheduleItem={selectedScheduleForOutlook}
        project={project}
        onNotificationSent={() => {
          onRefreshSchedules();
        }}
      />
    </div>
  );
});
