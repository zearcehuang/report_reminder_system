import { useState, useEffect } from 'react';
import { ScheduleItem, Project, SenderAccount } from '../../types';
import { api } from '../../services/api';
import { generateIcsBlobAndFileName } from './icsHelper';

export const useOutlookMeeting = (
  scheduleItem: ScheduleItem | null,
  project: Project,
  onNotificationSent?: () => void
) => {
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

  const initialDays =
    scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0
      ? scheduleItem.advanceNoticeDaysList
      : project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0
      ? project.advanceNoticeDaysList
      : [scheduleItem?.advanceNoticeDays || 3];

  const [selectedNoticeDays, setSelectedNoticeDays] = useState<number[]>(initialDays);

  useEffect(() => {
    if (scheduleItem || project) {
      const days =
        scheduleItem?.advanceNoticeDaysList && scheduleItem.advanceNoticeDaysList.length > 0
          ? scheduleItem.advanceNoticeDaysList
          : project?.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0
          ? project.advanceNoticeDaysList
          : [scheduleItem?.advanceNoticeDays || 3];
      setSelectedNoticeDays(days.sort((a, b) => b - a));

      // Pre-fill default sender PM email & name
      const pm =
        project?.projectOwners?.find((po) => po.role.includes('PM')) || project?.projectOwners?.[0];
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
    if (!scheduleItem) return '';
    const effectiveDueDate = scheduleItem.calculatedDate || new Date().toISOString().split('T')[0];
    const startIso = `${effectiveDueDate}T09:00:00Z`;
    const endIso = `${effectiveDueDate}T10:00:00Z`;
    const subject = `📌 履約報告繳交提醒會議: ${scheduleItem.title} (${project.code})`;
    const ownerListStr = Array.isArray(scheduleItem.owners)
      ? scheduleItem.owners.join(', ')
      : '專案團隊';
    const organizerEmail = activeSender?.email || senderEmail || 'pm@company.com';
    const organizerName = activeSender?.name || senderName || '專案PM';
    const body = `專案名稱: ${project.name}\n報告死線: ${effectiveDueDate}\n受邀負責人: ${ownerListStr}\n發布寄件者: ${organizerName} (${organizerEmail})\n\n備註說明: ${
      customNote || '請承辦同仁於死線前完成報告編製與審查'
    }`;

    const emails = scheduleItem.owners
      .map((o) => {
        const m = o.match(/<([^>]+)>/) || o.match(/\(([^)]+)\)/);
        return m ? m[1] : o;
      })
      .filter((e) => e.includes('@'))
      .join(';');

    return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      subject
    )}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(
      endIso
    )}&to=${encodeURIComponent(emails)}&body=${encodeURIComponent(
      body
    )}&location=${encodeURIComponent('履約報告系統線上會議')}`;
  };

  const handleDownloadIcsFile = () => {
    const { blob, fileName } = generateIcsBlobAndFileName(
      scheduleItem,
      project,
      activeSender,
      senderEmail,
      senderName,
      customNote
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIcsDownloadUrl(url);
    setIcsFileName(fileName);
    setSendSuccess(
      `已成功生成並下載 Outlook 會議預約檔 (${fileName})！您可以直接雙擊該檔案，會自動在 Outlook 行事曆中建立並發送會議邀請。`
    );
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登入失敗，請稍後重試';
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutSender = () => {
    setIsSenderLoggedIn(false);
    setActiveSender(null);
    localStorage.removeItem('report_reminder_sender_account');
  };

  const handleSendRealNotification = async () => {
    if (!scheduleItem) return;
    if (!isSenderLoggedIn || !activeSender) {
      setLoginError(
        '⚠️ 發布失敗：發出前要使用者先行登入要發布的寄件者以確保能真正發布！請點擊下方「登入/驗證身分」。'
      );
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

  const mailtoLink = scheduleItem
    ? `mailto:${scheduleItem.owners.join(',')}?subject=${encodeURIComponent(
        `[履約報告會議] ${scheduleItem.title}`
      )}&body=${encodeURIComponent(
        `專案: ${project.name}\n死線日期: ${scheduleItem.calculatedDate}\n受邀負責人: ${scheduleItem.owners.join(
          ', '
        )}\n\n發布寄件者: ${activeSender?.name || 'PM'} (${
          activeSender?.email || 'pm@company.com'
        })\n\n備註: ${customNote || '請承辦同仁於死線前完成上傳'}`
      )}`
    : '';

  return {
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
  };
};
