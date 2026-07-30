import React, { useState, useEffect } from 'react';
import { ScheduleItem, Project, SenderAccount, OutlookMeetingPayload } from '../types';
import { Send, X, Check, Calendar, User, Clock, ExternalLink, ShieldCheck, Download, AlertCircle, Mail, FileText } from 'lucide-react';
import { api } from '../services/api';

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

  const getNoticeDateStr = (dueDateIso: string, daysBefore: number) => {
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

      // Auto Download .ics Outlook Meeting Invitation file
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
        {/* Modal Header */}
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

        {/* 🔐 Sender Login Authentication Card Section */}
        <div style={{
          background: isSenderLoggedIn ? '#f0fdf4' : '#fff1f2',
          border: isSenderLoggedIn ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem 1.1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSenderLoggedIn ? 0 : '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color={isSenderLoggedIn ? '#16a34a' : '#dc2626'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSenderLoggedIn ? '#166534' : '#991b1b' }}>
                {isSenderLoggedIn
                  ? `✓ 已成功登入發布寄件者帳號: [${activeSender?.name}] (${activeSender?.email})`
                  : '⚠️ 發布寄件者身分登入驗證 (正式發布 Outlook 會議信件前必須先登入帳號)'}
              </span>
            </div>
            {isSenderLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setIsSenderLoggedIn(false);
                  setActiveSender(null);
                  localStorage.removeItem('report_reminder_sender_account');
                }}
                style={{ background: '#ffffff', border: '1px solid #86efac', color: '#166534', fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                切換寄件者帳號
              </button>
            )}
          </div>

          {!isSenderLoggedIn && (
            <form onSubmit={handleLoginSender}>
              <p style={{ fontSize: '0.775rem', color: '#7f1d1d', margin: '0 0 0.65rem 0' }}>
                為確保 Outlook 會議預約信件能真實發出至權責對象信箱，發出前請先完成發布寄件者帳號驗證：
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="email"
                  className="input-glass"
                  placeholder="寄件者 Email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
                  required
                />
                <input
                  type="text"
                  className="input-glass"
                  placeholder="顯示姓名 (如: 張小明 PM)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
                />
                <input
                  type="password"
                  className="input-glass"
                  placeholder="Outlook 授權密碼"
                  value={senderPassword}
                  onChange={(e) => setSenderPassword(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                  }}
                >
                  {isLoggingIn ? '驗證中...' : '🔐 登入驗證身分'}
                </button>
              </div>
            </form>
          )}

          {loginError && (
            <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={15} />
              <span>{loginError}</span>
            </div>
          )}
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
            <Clock size={14} color="#0078d4" /> 選擇 Outlook 會議預警包含的天數 (可複選):
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
                    border: isSelected ? '2px solid #0078d4' : '1px solid #cbd5e1',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#005a9e' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{day} 天前預警 ({datePreview})</span>
                  {isSelected && <span style={{ fontSize: '0.75rem', color: '#0078d4', fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Outlook Meeting Card Mockup */}
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
        </div>

        {/* Custom Note input */}
        <div style={{ marginBottom: '1.25rem' }}>
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

        {/* Success Alert */}
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

            {/* Direct Outlook Launch Actions */}
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
          {/* Direct Manual Download Button */}
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
