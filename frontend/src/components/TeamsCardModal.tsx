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

  if (!isOpen || !scheduleItem) return null;

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

        {/* Live Adaptive Card Mockup */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
            MS TEAMS LIVE ADAPTIVE CARD PREVIEW
          </div>

          <div style={{
            background: '#1f1f1f',
            borderLeft: '4px solid #5b5fc7',
            borderRadius: '8px',
            padding: '1.25rem',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
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
                <span style={{ fontSize: '0.8rem', color: '#a1a1a1' }}>[{project.code}] {project.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#ffb74d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> 提前 {scheduleItem.advanceNoticeDays} 天預警
              </span>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.75rem', fontWeight: 700 }}>
              📌 履約報告繳交提醒：{scheduleItem.title}
            </h3>

            {/* Facts Grid */}
            <div style={{
              background: '#2d2d2d',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.65rem',
              fontSize: '0.825rem',
              marginBottom: '1rem',
            }}>
              <div>
                <span style={{ color: '#adadad', display: 'block', fontSize: '0.725rem' }}>報告死線 (Due Date)</span>
                <strong style={{ color: '#f87171', fontSize: '0.95rem' }}>{scheduleItem.calculatedDate}</strong>
                {scheduleItem.wasShiftedByHoliday && (
                  <span style={{ fontSize: '0.7rem', color: '#c084fc', marginLeft: '0.3rem' }}>
                    ({scheduleItem.holidayName}順延)
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: '#adadad', display: 'block', fontSize: '0.725rem' }}>報告負責人 (Owners)</span>
                <strong style={{ color: '#818cf8' }}>{scheduleItem.owners.join(', ')}</strong>
              </div>

              <div>
                <span style={{ color: '#adadad', display: 'block', fontSize: '0.725rem' }}>當前狀態</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{scheduleItem.status}</span>
              </div>

              <div>
                <span style={{ color: '#adadad', display: 'block', fontSize: '0.725rem' }}>專案 D-Day 基準</span>
                <span style={{ color: '#e2e8f0' }}>D + {scheduleItem.dDayOffset} 天</span>
              </div>
            </div>

            {/* Custom note inside preview */}
            <div style={{
              background: 'rgba(91, 95, 199, 0.15)',
              border: '1px dashed rgba(91, 95, 199, 0.4)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              color: '#d1d5db',
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
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
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
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
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
