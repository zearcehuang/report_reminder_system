import React from 'react';
import { ScheduleItem } from '../../types';
import { CheckCircle2, Calendar, RotateCcw, Trash2, Edit3 } from 'lucide-react';

interface ScheduleCardActionsProps {
  item: ScheduleItem;
  onEditScheduleDate?: (item: ScheduleItem) => void;
  onToggleSubmitted: (id: string, isCompleted: boolean) => Promise<void>;
  onSelectForOutlook: (item: ScheduleItem) => void;
  onDeleteSingle: (item: ScheduleItem) => void;
  isDeleting: boolean;
}

export const ScheduleCardActions: React.FC<ScheduleCardActionsProps> = ({
  item,
  onEditScheduleDate,
  onToggleSubmitted,
  onSelectForOutlook,
  onDeleteSingle,
  isDeleting,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {onEditScheduleDate && (
        <button
          className="btn-secondary"
          onClick={() => onEditScheduleDate(item)}
          style={{
            padding: '0.45rem 0.75rem',
            fontSize: '0.8rem',
            borderColor: '#c7d2fe',
            color: '#3730a3',
            background: '#e0e7ff',
          }}
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
        onClick={() => onSelectForOutlook(item)}
        style={{
          padding: '0.45rem 0.85rem',
          fontSize: '0.8rem',
          background: 'rgba(0, 120, 212, 0.12)',
          borderColor: 'rgba(0, 120, 212, 0.3)',
          color: '#005a9e',
        }}
        title="發布 Outlook 會議預約信件與下載 .ics 會議檔"
      >
        <Calendar size={15} color="#0078d4" /> 發布 Outlook 會議
      </button>

      <button
        className="btn-secondary"
        onClick={() => onDeleteSingle(item)}
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
  );
};
