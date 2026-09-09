import React from 'react';
import { Calendar, Search, FilePlus } from 'lucide-react';

interface TimelineFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  onOpenAddReportModal?: () => void;
}

const STATUS_OPTIONS = ['ALL', 'Pending', 'Sent', 'Submitted'];

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onOpenAddReportModal,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            background: 'var(--accent-gradient)',
            padding: '0.55rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}
        >
          <Calendar size={22} color="#fff" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>專案履約報告繳交時間軸 (Schedule Timeline)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            依行政院人事行政總處 (DGPA) 辦公日曆自動避開例假日與國定假日
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onOpenAddReportModal && (
          <button
            onClick={onOpenAddReportModal}
            className="btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
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
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            background: 'rgba(241, 245, 249, 0.9)',
            border: '1px solid rgba(203, 213, 225, 0.8)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.15rem',
          }}
        >
          {STATUS_OPTIONS.map((st) => (
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
  );
};
