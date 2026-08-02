import React, { useState, useEffect } from 'react';
import { ScheduleItem, Project, SenderAccount } from '../types';
import { Send, X, Calendar, Download, Check, Mail } from 'lucide-react';
import { api } from '../services/api';
import { SenderAuthCard } from './OutlookMeetingModal/SenderAuthCard';
import { NoticeDaysPicker } from './OutlookMeetingModal/NoticeDaysPicker';
import { MeetingPreviewCard } from './OutlookMeetingModal/MeetingPreviewCard';

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
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [icsDownloadUrl, setIcsDownloadUrl] = useState<string | null>(null);
  const [icsFileName, setIcsFileName] = useState<string>('');

  // Sender Login State
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeSender, setActiveSender] = useState<SenderAccount | null>(null);
  const [isSenderLoggedIn, setIsSenderLoggedIn] = useState(false);

  const initialDays = (scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0)
    ? scheduleItem.advanceNoticeDaysList
    : (project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0)
      ? project.advanceNoticeDaysList
      : [scheduleItem?.advanceNoticeDays || 3];

  const [selectedNoticeDays, setSelectedNoticeDays] = useState<number[]>(initialDays);

  useEffect(() => {
    if (scheduleItem || project) {
      const days = (scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0)
        ? scheduleItem.advanceNoticeDaysList
        : (project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0)
          ? project.advanceNoticeDaysList
          : [scheduleItem?.advanceNoticeDays || 3];
      setSelectedNoticeDays(days.sort((a, b) => b - a));

      // Pre-fill default sender PM email & name
      const pm = project?.projectOwners?.find((po) => po.role.includes('PM')) || project?.projectOwners?.[0];
      const defaultEmail = pm?.email || project?.ownerEmail || 'alex.chang@company.com';
      const defaultName = pm ? `${pm.name} (${pm.role})` : project?.ownerName || '張小明 (PM)';

      setSenderEmail(defaultEmail);
      setSenderName(defaultName);
      setSenderPassword('pass1234');
      setLoginError('');
      setCustomNote('');

      // Check if previously logged in
      const savedSender = localStorage.getItem('report_reminder_sender_account');
      if (savedSender) {
        try {
          const parsed = JSON.parse(savedSender);
          if (parsed && parsed.token && parsed.email) {
            setActiveSender(parsed);
            setIsSenderLoggedIn(true);
          }
        } catch {
          // ignore
        }
      }
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

  const getNoticeDateStr = (dueDateIso: string | undefined, daysBefore: number) => {
    if (!dueDateIso) return '';
    const d = new Date(dueDateIso);
    d.setDate(d.getDate() - daysBefore);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}`;
  };

  const getOutlookWebCalendarLink = () => {
    const effectiveDueDate = scheduleItem.calculatedDate || new Date().toISOString().split('T')[0];
    const startIso = `${effectiveDueDate}T09:00:00Z`;
    const endIso = `${effectiveDueDate}T10:00:00Z`;
    const subject = `📌 履約報告繳交提醒會議: ${scheduleItem.title} (${project.code})`;
    const ownerListStr = Array.isArray(scheduleItem.owners) ? scheduleItem.owners.join(', ') : '專案團隊';
    const organizerEmail = activeSender?.email || senderEmail || 'pm@company.com';
    const organizerName = activeSender?.name || senderName || '專案PM';
    const body = `專案名稱: ${project.name}\n報告死線: ${effectiveDueDate}\n受邀負責人: ${ownerListStr}\n發布寄件者: ${organizerName} (${organizerEmail})\n\n備註說明: ${customNote || '請承辦同仁於死線前完成報告編製與審查'}`;

    const emails = scheduleItem.owners
      .map((o) => {
        const m = o.match(/<([^>]+)>/) || o.match(/\(([^)]+)\)/);
        return m ? m[1] : o;
      })
      .filter((e) => e.includes('@'))
      .join(';');

    return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(subject)}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&to=${encodeURIComponent(emails)}&body=${encodeURIComponent(body)}&location=${encodeURIComponent('履約報告系統線上會議')}`;
  };

  const generateIcsBlobAndFileName = () => {
    const effectiveDueDate = scheduleItem.calculatedDate || new Date().toISOString().split('T')[0];
    const nowClean = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const meetingDateStr = effectiveDueDate.replace(/-/g, '');
    const dtStart = `${meetingDateStr}T090000Z`;
    const dtEnd = `${meetingDateStr}T100000Z`;
    const ownerListStr = Array.isArray(scheduleItem.owners) ? scheduleItem.owners.join(', ') : '專案團隊';
    const organizerEmail = activeSender?.email || senderEmail || 'pm@company.com';
    const organizerName = activeSender?.name || senderName || '專案PM';

    const ownerEmailList = Array.isArray(scheduleItem.owners)
      ? scheduleItem.owners
          .map((o) => {
            const m = o.match(/<([^>]+)>/) || o.match(/\(([^)]+)\)/);
            return m ? m[1] : o;
          })
          .filter((e) => e.includes('@'))
      : [];

    const attendeeLines = ownerEmailList.map(
      (e) => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="${e.split('@')[0]}":mailto:${e}`
    );

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Report Reminder System//Outlook Meeting Notification//TW',
      'METHOD:REQUEST',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:report-reminder-${Date.now()}@company.com`,
      'SEQUENCE:0',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'X-MICROSOFT-CDO-BUSYSTATUS:BUSY',
      'X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY',
      'X-MICROSOFT-DISALLOW-COUNTER:FALSE',
      `DTSTAMP:${nowClean}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:📌 履約報告繳交提醒會議: ${scheduleItem.title} (${project.code})`,
      `DESCRIPTION:專案名稱: ${project.name}\\n報告死線: ${effectiveDueDate}\\n受邀負責人: ${ownerListStr}\\n發布寄件者: ${organizerName} (${organizerEmail})\\n\\n備註: ${customNote || '請承辦同仁於死線前完成報告編製與審查'}`,
      `ORGANIZER;CN="${organizerName}":mailto:${organizerEmail}`,
      ...attendeeLines,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8;' });
    const fileName = `履約里程碑會議邀請_${scheduleItem.title}.ics`;
    return { blob, fileName, icsLines };
  };

  const handleDownloadIcsFile = () => {
    const { blob, fileName } = generateIcsBlobAndFileName();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIcsDownloadUrl(url);
    setIcsFileName(fileName);
    setSendSuccess(`已成功生成並下載 Outlook 會議預約檔 (${fileName})！您可以直接雙擊該檔案，會自動在 Outlook 行事曆中建立並發送會議邀請。`);
  };

  const handleLoginSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail || !senderEmail.includes('@')) {
      setLoginError('請輸入有效的發布寄件者 Email 帳號');
      return;
    }
    if (!senderPassword) {
      setLoginError('請輸入發布寄件者 Outlook 密碼或金鑰');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await api.loginSender(senderEmail.trim(), senderPassword, senderName.trim());
      if (res.success && res.sender) {
        setActiveSender(res.sender);
        setIsSenderLoggedIn(true);
        localStorage.setItem('report_reminder_sender_account', JSON.stringify(res.sender));
        setLoginError('');
      } else {
        setLoginError(res.error || '驗證失敗，請檢查密碼與帳號');
      }
    } catch (err: any) {
      setLoginError(err?.message || '登入失敗，請稍後重試');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendRealNotification = async () => {
    if (!isSenderLoggedIn || !activeSender) {
      setLoginError('⚠️ 發布失敗：發出前要使用者先行登入要發布的寄件者以確保能真正發布！請點擊下方「登入/驗證身分」。');
      return;
    }

    setIsSending(true);
    setSendSuccess(null);
    setIcsDownloadUrl(null);
    setLoginError('');

    try {
      const res = await api.sendOutlookMeetingNotification({
        scheduleId: scheduleItem.id,
        title: scheduleItem.title,
        projectName: project.name,
        projectCode: project.code,
        dueDate: scheduleItem.calculatedDate,
        owners: scheduleItem.owners,
        status: scheduleItem.status,
        customMessage: customNote || '請承辦同仁於死線前完成上傳並點擊團隊審核確認！',
        advanceNoticeDaysList: selectedNoticeDays,
        senderEmail: activeSender.email,
        senderName: activeSender.name,
        senderAuthToken: activeSender.token,
      });

      if (!res.success) {
        setLoginError(res.message || '發布失敗，請再次確認寄件者帳號登入狀態');
        return;
      }

      setSendSuccess(res.message);
      handleDownloadIcsFile();

      if (onNotificationSent) onNotificationSent();
    } catch {
      setLoginError('發送 Outlook 會議訊息失敗，請檢查連線');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '720px', padding: '1.75rem', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)',
            }}>
              <Calendar size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Microsoft Outlook 會議預約發布與 .ics 匯入檔中心</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                發布前需驗證登入發布寄件者帳號；可正式發布 Outlook 會議信件或下載 (.ics) 供手動匯入 Outlook
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
          onLogout={() => {
            setIsSenderLoggedIn(false);
            setActiveSender(null);
            localStorage.removeItem('report_reminder_sender_account');
          }}
        />

        <NoticeDaysPicker
          presetDayOptions={presetDayOptions}
          selectedNoticeDays={selectedNoticeDays}
          calculatedDate={scheduleItem.calculatedDate}
          onToggleNoticeDay={handleToggleNoticeDay}
          getNoticeDateStr={getNoticeDateStr}
        />

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
          <div className="animate-fade-in" style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            color: '#047857',
            padding: '0.9rem 1.1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <Check size={20} color="#059669" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sendSuccess}</span>
            </div>

            <p style={{ fontSize: '0.775rem', color: '#065f46', margin: '0 0 0.65rem 0', fontWeight: 500 }}>
              💡 提醒：要讓會議「真正出現在您與受邀對象的 Outlook 行事曆」上，請選擇以下方式發出會議邀請：
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <a
                href={getOutlookWebCalendarLink()}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
                  color: '#ffffff',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '5px',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(0, 120, 212, 0.25)',
                }}
              >
                <Calendar size={16} /> 📅 方式一：開啟 Outlook 網頁版行事曆正式發送 (點擊「傳送」後將自動出現在全員行事曆)
              </a>

              {icsDownloadUrl && (
                <a
                  href={icsDownloadUrl}
                  download={icsFileName}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '5px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Download size={16} /> 📥 方式二：下載 Outlook 具名會議檔 ({icsFileName})，雙擊該檔會開啟 Outlook 桌面版會議邀請
                </a>
              )}

              <a
                href={`mailto:${scheduleItem.owners.join(',')}?subject=${encodeURIComponent(`[履約報告會議] ${scheduleItem.title}`)}&body=${encodeURIComponent(`專案: ${project.name}\n死線日期: ${scheduleItem.calculatedDate}\n受邀負責人: ${scheduleItem.owners.join(', ')}\n\n發布寄件者: ${activeSender?.name || 'PM'} (${activeSender?.email || 'pm@company.com'})\n\n備註: ${customNote || '請承辦同仁於死線前完成上傳'}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.775rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  width: 'fit-content',
                }}
              >
                <Mail size={14} /> ✉️ 方式三：開啟預設 Outlook 桌面郵件軟體
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <span>{isSending ? '發布進行中...' : (isSenderLoggedIn ? '正式發布 Outlook 會議預約信件' : '請先登入寄件者後發布')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
