import React, { useState, memo } from 'react';
import { ScheduleItem, Project } from '../types';
import { Clock } from 'lucide-react';
import { OutlookMeetingModal } from './OutlookMeetingModal';
import { useToast } from '../hooks/useToast';
import { TimelineFilterBar } from './ScheduleTimeline/TimelineFilterBar';
import { BatchSelectBar } from './ScheduleTimeline/BatchSelectBar';
import { ScheduleCard } from './ScheduleTimeline/ScheduleCard';

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

  const filtered = schedules.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owners.some((o) => o.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const handleDeleteSingle = async (item: ScheduleItem) => {
    const itemIdStr = String(item.id);
    toast.confirm(
      '刪除履約項目',
      `確定要刪除「${item.title}」此履約報告繳交項目嗎？此動作無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          if (onDeleteSchedule) {
            await onDeleteSchedule(itemIdStr);
            toast.success(`成功刪除 ${item.title}`);
          }
          setSelectedIds((prev) => prev.filter((id) => String(id) !== itemIdStr));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '刪除失敗';
          toast.error(msg);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const targetIds = [...selectedIds.map((id) => String(id))];
    toast.confirm(
      '批次刪除',
      `確定要刪除選取的 ${targetIds.length} 個履約報告繳交項目嗎？此動作無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          if (onBatchDeleteSchedules) {
            await onBatchDeleteSchedules(targetIds);
            toast.success(`成功刪除 ${targetIds.length} 筆項目`);
          }
          setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(String(id))));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '批次刪除失敗';
          toast.error(msg);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleToggleSelectCard = (itemIdStr: string) => {
    if (selectedIds.map(String).includes(itemIdStr)) {
      setSelectedIds(selectedIds.filter((id) => String(id) !== itemIdStr));
    } else {
      setSelectedIds([...selectedIds, itemIdStr]);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <TimelineFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenAddReportModal={onOpenAddReportModal}
      />

      <BatchSelectBar
        filtered={filtered}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onBatchDelete={handleBatchDelete}
        isDeleting={isDeleting}
      />

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
            {filtered.map((item) => (
              <ScheduleCard
                key={item.id}
                item={item}
                isSelected={selectedIds.map(String).includes(String(item.id))}
                onToggleSelect={handleToggleSelectCard}
                onEditScheduleDate={onEditScheduleDate}
                onToggleSubmitted={onToggleSubmitted}
                onSelectForOutlook={setSelectedScheduleForOutlook}
                onDeleteSingle={handleDeleteSingle}
                isDeleting={isDeleting}
              />
            ))}
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
        onNotificationSent={onRefreshSchedules}
      />
    </div>
  );
});
