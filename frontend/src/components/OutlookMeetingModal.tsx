import React from 'react';
import { ScheduleItem, Project } from '../types';
import { Send, X, Calendar, Download } from 'lucide-react';
import { SenderAuthCard } from './OutlookMeetingModal/SenderAuthCard';
import { NoticeDaysPicker } from './OutlookMeetingModal/NoticeDaysPicker';
import { MeetingPreviewCard } from './OutlookMeetingModal/MeetingPreviewCard';
import { SuccessActionsCard } from './OutlookMeetingModal/SuccessActionsCard';
import { useOutlookMeeting } from './OutlookMeetingModal/useOutlookMeeting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scheduleItem: ScheduleItem | null;
  project: Project;
  onNotificationSent?: () => void;
}

export const OutlookMeetingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scheduleItem,
  project,
  onNotificationSent,
}) => {
  const {
    customNote,
    setCustomNote,
    isSending,
    sendSuccess,
    icsDownloadUrl,
    icsFileName,
    senderEmail,
    setSenderEmail,
    senderName,
    setSenderName,
    senderPassword,
    setSenderPassword,
    isLoggingIn,
    loginError,
    activeSender,
    isSenderLoggedIn,
    selectedNoticeDays,
    handleToggleNoticeDay,
    getNoticeDateStr,
    handleDownloadIcsFile,
    handleLoginSender,
    handleLogoutSender,
    handleSendRealNotification,
    getOutlookWebCalendarLink,
    mailtoLink,
  } = useOutlookMeeting(scheduleItem, project, onNotificationSent);

  if (!isOpen || !scheduleItem) return null;

  const presetDayOptions = [1, 3, 5, 7, 14, 30];

  return (
    <div className="modal-overlay">
      <div
        className="glass-modal width-full"
        style={{
          maxWidth: '720px',
          padding: '1.75rem',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)',
              }}
            >
              <Calendar size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                Microsoft Outlook 會議預約發布與 .ics 匯入檔中心
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                發布前需驗證登入發布寄件者帳號；可正式發布 Outlook 會議信件或下載 (.ics) 供手動匯入 Outlook
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sender Auth Card */}
        <SenderAuthCard
          isSenderLoggedIn={isSenderLoggedIn}
          activeSender={activeSender}
          senderEmail={senderEmail}
          senderName={senderName}
          senderPassword={senderPassword}
          isLoggingIn={isLoggingIn}
          loginError={loginError}
          setSenderEmail={setSenderEmail}
          setSenderName={setSenderName}
          setSenderPassword={setSenderPassword}
          onLogin={handleLoginSender}
          onLogout={handleLogoutSender}
        />

        {/* Notice Days Selection */}
        <NoticeDaysPicker
          presetDayOptions={presetDayOptions}
          selectedNoticeDays={selectedNoticeDays}
          calculatedDate={scheduleItem.calculatedDate}
          onToggleNoticeDay={handleToggleNoticeDay}
          getNoticeDateStr={getNoticeDateStr}
        />

        {/* Meeting Preview */}
        <MeetingPreviewCard
          project={project}
          scheduleItem={scheduleItem}
          selectedNoticeDays={selectedNoticeDays}
          isSenderLoggedIn={isSenderLoggedIn}
          activeSender={activeSender}
          customNote={customNote}
          setCustomNote={setCustomNote}
        />

        {/* Success Alert & Actions */}
        {sendSuccess && (
          <SuccessActionsCard
            sendSuccess={sendSuccess}
            outlookWebCalendarLink={getOutlookWebCalendarLink()}
            icsDownloadUrl={icsDownloadUrl}
            icsFileName={icsFileName}
            mailtoLink={mailtoLink}
          />
        )}

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={handleDownloadIcsFile}
            style={{
              background: '#f8fafc',
              border: '1.5px solid #0078d4',
              color: '#0078d4',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 4px rgba(0, 120, 212, 0.1)',
            }}
            title="不用登入即可直接下載標準 Outlook 會議檔 (.ics)，雙擊即可直接匯入 Outlook 日曆"
          >
            <Download size={16} /> 下載 Outlook 會議檔 (.ics 手動匯入)
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              關閉
            </button>
            <button
              className="btn-primary"
              onClick={handleSendRealNotification}
              disabled={isSending}
              style={{
                background: isSenderLoggedIn
                  ? 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)'
                  : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                boxShadow: isSenderLoggedIn ? '0 4px 12px rgba(0, 120, 212, 0.3)' : 'none',
              }}
            >
              <Send size={16} />
              <span>
                {isSending
                  ? '發布進行中...'
                  : isSenderLoggedIn
                  ? '正式發布 Outlook 會議預約信件'
                  : '請先登入寄件者後發布'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
