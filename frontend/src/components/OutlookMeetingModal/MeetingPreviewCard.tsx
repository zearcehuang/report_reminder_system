import React from 'react';
import { Mail, Clock } from 'lucide-react';
import { ScheduleItem, Project, SenderAccount } from '../../types';

interface MeetingPreviewCardProps {
  project: Project;
  scheduleItem: ScheduleItem;
  selectedNoticeDays: number[];
  isSenderLoggedIn: boolean;
  activeSender: SenderAccount | null;
  customNote: string;
  setCustomNote: (note: string) => void;
}

export const MeetingPreviewCard: React.FC<MeetingPreviewCardProps> = ({
  project,
  scheduleItem,
  selectedNoticeDays,
  isSenderLoggedIn,
  activeSender,
  customNote,
  setCustomNote
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
        MICROSOFT OUTLOOK MEETING INVITATION PREVIEW
      </div>

      <div style={{
        background: '#ffffff',
        borderLeft: '4px solid #0078d4',
        borderTop: '1px solid #e1dfdd',
        borderRight: '1px solid #e1dfdd',
        borderBottom: '1px solid #e1dfdd',
        borderRadius: '8px',
        padding: '1.25rem',
        color: '#242424',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Outlook Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: '#0078d4',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <Mail size={12} /> Outlook 會議邀請
            </span>
            <span style={{ fontSize: '0.8rem', color: '#605e5c' }}>[{project.code}] {project.name}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> 預警頻率: {selectedNoticeDays.sort((a, b) => b - a).map((d) => `${d}天前`).join(', ')}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700 }}>
          📌 履約報告繳交提醒會議：{scheduleItem.title}
        </h3>

        {/* Facts Grid */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '0.85rem 1rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.65rem',
          fontSize: '0.825rem',
          marginBottom: '1rem',
        }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>報告死線 (Due Date)</span>
            <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>{scheduleItem.calculatedDate}</strong>
            {scheduleItem.wasShiftedByHoliday && (
              <span style={{ fontSize: '0.7rem', color: '#7c3aed', marginLeft: '0.3rem' }}>
                ({scheduleItem.holidayName}順延)
              </span>
            )}
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>會議受邀者 (Attendees)</span>
            <strong style={{ color: '#4338ca' }}>{scheduleItem.owners.join(', ')}</strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>發布寄件者 (Organizer)</span>
            <strong style={{ color: isSenderLoggedIn ? '#166534' : '#dc2626' }}>
              {activeSender ? `${activeSender.name} (${activeSender.email})` : '未登入寄件者帳號'}
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>預估會議時間</span>
            <span style={{ color: '#334155', fontWeight: 600 }}>09:00 - 10:00 AM (報告死線日)</span>
          </div>
        </div>

        {/* Custom note inside preview */}
        <div style={{
          background: '#eff6ff',
          border: '1px dashed #0078d4',
          borderRadius: '6px',
          padding: '0.65rem 0.85rem',
          fontSize: '0.8rem',
          color: '#1e3a8a',
          marginBottom: '1rem',
        }}>
          💬 <strong>會議內文備註:</strong> {customNote || '請承辦同仁於死線前完成上傳並點擊團隊審核確認！'}
        </div>
      </div>

      {/* Custom Note input outside the card but logically associated */}
      <div style={{ marginTop: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          發送附言 / 會議內文說明 (將寫入 Outlook 會議說明)
        </label>
        <input
          type="text"
          className="input-glass"
          placeholder="例如: 請務必夾帶章節 4.2 系統測試報告結果"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
        />
      </div>
    </div>
  );
};
