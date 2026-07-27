import React, { useState } from 'react';
import { ScheduleItem, Project } from '../types';
import { Send, X, Check, Bell, Calendar, User, Clock, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scheduleItem: ScheduleItem | null;
  project: Project;
  onNotificationSent?: () => void;
}

export const TeamsCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scheduleItem,
  project,
  onNotificationSent,
}) => {
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const initialDays = (scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0)
    ? scheduleItem.advanceNoticeDaysList
    : (project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0)
      ? project.advanceNoticeDaysList
      : [scheduleItem?.advanceNoticeDays || 3];

  const [selectedNoticeDays, setSelectedNoticeDays] = useState<number[]>(initialDays);

  React.useEffect(() => {
    if (scheduleItem || project) {
      const days = (scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0)
        ? scheduleItem.advanceNoticeDaysList
        : (project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0)
          ? project.advanceNoticeDaysList
          : [scheduleItem?.advanceNoticeDays || 3];
      setSelectedNoticeDays(days.sort((a, b) => b - a));
    }
  }, [scheduleItem, project]);

  if (!isOpen || !scheduleItem) return null;

  const presetDayOptions = [1, 3, 5, 7, 14, 30];

  const handleToggleNoticeDay = (day: number) => {
    if (selectedNoticeDays.includes(day)) {
      if (selectedNoticeDays.length === 1) return;
      setSelectedNoticeDays(selectedNoticeDays.filter((d) => d !== day));
    } else {
      setSelectedNoticeDays([...selectedNoticeDays, day].sort((a, b) => b - a));
    }
  };

  const getNoticeDateStr = (dueDateIso: string, daysBefore: number) => {
    if (!dueDateIso) return '';
    const d = new Date(dueDateIso);
    d.setDate(d.getDate() - daysBefore);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}`;
  };

  const handleSendTest = async () => {
    setIsSending(true);
    setSendSuccess(null);
    try {
      const res = await api.sendTeamsTestNotification({
        scheduleId: scheduleItem.id,
        title: scheduleItem.title,
        projectName: project.name,
        projectCode: project.code,
        dueDate: scheduleItem.calculatedDate,
        owners: scheduleItem.owners,
        status: scheduleItem.status,
        customMessage: customNote || '請承辦同仁於死線前完成上傳並點擊團隊審核確認！',
        advanceNoticeDaysList: selectedNoticeDays,
      });
      setSendSuccess(res.message);
      if (onNotificationSent) onNotificationSent();
    } catch {
      alert('發送 Teams 訊息失敗');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '680px', padding: '1.75rem' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #5b5fc7 0%, #464775 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 12px rgba(91, 95, 199, 0.3)',
            }}>
              <MessageSquare size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Microsoft Teams Adaptive Card 預覽與即時測試發送</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                即時預覽 Teams Webhook 推播提醒卡片樣式
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Multi-Select Warning Days Pills */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} color="#2563eb" /> 選擇此廣播測試包含的預警天數 (可複選):
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            {presetDayOptions.map((day) => {
              const isSelected = selectedNoticeDays.includes(day);
              const datePreview = getNoticeDateStr(scheduleItem.calculatedDate, day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleToggleNoticeDay(day)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{day} 天前預警 ({datePreview})</span>
                  {isSelected && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Adaptive Card Mockup */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
            MS TEAMS LIVE ADAPTIVE CARD PREVIEW
          </div>

          <div style={{
            background: '#ffffff',
            borderLeft: '4px solid #5b5fc7',
            borderTop: '1px solid #e1dfdd',
            borderRight: '1px solid #e1dfdd',
            borderBottom: '1px solid #e1dfdd',
            borderRadius: '8px',
            padding: '1.25rem',
            color: '#242424',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}>
            {/* Teams Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  background: '#5b5fc7',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                }}>
                  專案提醒通知 BOT
                </span>
                <span style={{ fontSize: '0.8rem', color: '#605e5c' }}>[{project.code}] {project.name}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> 預警頻率: {selectedNoticeDays.sort((a, b) => b - a).map((d) => `${d}天前`).join(', ')}
              </div>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700 }}>
              📌 履約報告繳交提醒：{scheduleItem.title}
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
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>報告負責人 (Owners)</span>
                <strong style={{ color: '#4338ca' }}>{scheduleItem.owners.join(', ')}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>預警廣播時間表</span>
                <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.775rem' }}>
                  {selectedNoticeDays.map((d) => `${d}天前(${getNoticeDateStr(scheduleItem.calculatedDate, d)})`).join(' • ')}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>專案 D-Day 基準</span>
                <span style={{ color: '#334155' }}>D + {scheduleItem.dDayOffset} 天</span>
              </div>
            </div>

            {/* Custom note inside preview */}
            <div style={{
              background: '#eff6ff',
              border: '1px dashed #5b5fc7',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              color: '#1e3a8a',
              marginBottom: '1rem',
            }}>
              💬 <strong>備註說明:</strong> {customNote || '請承辦同仁於死線前完成上傳並點擊團隊審核確認！'}
            </div>

            {/* Simulated Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{
                background: '#5b5fc7',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                開啟系統簽核 / 繳交
              </div>

              <div style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '0.45rem 1rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}>
                通報 PM
              </div>
            </div>
          </div>
        </div>

        {/* Custom Note input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            發送附言 / 提醒備註 (附加於 Adaptive Card)
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="例如: 請務必夾帶章節 4.2 系統測試報告結果"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
          />
        </div>

        {/* Success Alert */}
        {sendSuccess && (
          <div className="animate-fade-in" style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Check size={18} /> {sendSuccess}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose}>
            關閉預覽
          </button>
          <button
            className="btn-primary"
            onClick={handleSendTest}
            disabled={isSending}
            style={{ background: 'linear-gradient(135deg, #5b5fc7 0%, #3b82f6 100%)' }}
          >
            <Send size={16} /> {isSending ? '測試推播中...' : '即時測試發送 Teams 卡片'}
          </button>
        </div>
      </div>
    </div>
  );
};
