const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { requirePermission, requireAuth, verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'notification_logs.json');

// Get notification logs
router.get('/logs', requireAuth, (req, res) => {
  const logs = readJsonSync(LOGS_FILE, []);
  res.json(logs);
});

// Clear notification logs (Admin only)
router.post('/logs/clear', requirePermission('system:admin'), (req, res) => {
  writeJsonSync(LOGS_FILE, []);
  res.json({ success: true, message: '通知發送日誌已成功清空' });
});

// Handle Outlook Meeting Dispatch
const handleOutlookMeetingDispatch = async (req, res) => {
  const {
    projectCode,
    projectName,
    title,
    deadlineDate,
    dueDate,
    owners,
    advanceNoticeDaysList,
    customMessage,
    senderEmail,
    senderName,
    senderAuthToken
  } = req.body;

  if (!senderAuthToken || !senderEmail) {
    return res.status(401).json({
      success: false,
      error: '⚠️ 發布失敗：發出前必須先行登入要發布的寄件者帳號，以確保能真正發出 Outlook 會議通知與預約信件！'
    });
  }

  const verifiedSender = verifyToken(senderAuthToken);
  if (!verifiedSender) {
    return res.status(401).json({
      success: false,
      error: '⚠️ 寄件者憑證無效或已過期，請重新登入寄件者帳號'
    });
  }

  const effectiveDueDate = deadlineDate || dueDate || new Date().toISOString().split('T')[0];
  const noticeList = Array.isArray(advanceNoticeDaysList) && advanceNoticeDaysList.length > 0
    ? advanceNoticeDaysList.sort((a, b) => b - a)
    : [3];

  const nowClean = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const meetingDateStr = effectiveDueDate.replace(/-/g, '');
  const dtStart = `${meetingDateStr}T090000Z`;
  const dtEnd = `${meetingDateStr}T100000Z`;
  const ownerListStr = Array.isArray(owners) ? owners.join(', ') : (owners || '專案團隊');

  const ownerEmailList = Array.isArray(owners)
    ? owners.map((o) => {
        const m = o.match(/<([^>]+)>/) || o.match(/\(([^)]+)\)/);
        return m ? m[1] : o;
      }).filter((e) => e.includes('@'))
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
    `SUMMARY:📌 履約報告繳交提醒會議: ${title} (${projectCode || 'PRJ'})`,
    `DESCRIPTION:專案名稱: ${projectName}\\n報告死線: ${effectiveDueDate}\\n受邀負責人: ${ownerListStr}\\n發布寄件者: ${senderName} (${senderEmail})\\n\\n備註: ${customMessage || '請同仁於死線前完成報告編製與審查'}`,
    `ORGANIZER;CN="${senderName}":mailto:${senderEmail}`,
    ...attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');

  const subjectStr = `📌 履約報告繳交提醒會議: ${title} (${projectCode || 'PRJ'})`;
  const bodyStr = `專案名稱: ${projectName}\n報告死線: ${effectiveDueDate}\n受邀負責人: ${ownerListStr}\n發布寄件者: ${senderName} (${senderEmail})\n\n備註說明: ${customMessage || '請同仁於死線前完成報告編製與審查'}`;
  const startIso = `${effectiveDueDate}T09:00:00Z`;
  const endIso = `${effectiveDueDate}T10:00:00Z`;
  const toEmailsStr = ownerEmailList.join(';');

  const outlookCalendarLink = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(subjectStr)}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&to=${encodeURIComponent(toEmailsStr)}&body=${encodeURIComponent(bodyStr)}&location=${encodeURIComponent('履約報告系統線上會議')}`;

  res.json({
    success: true,
    message: `🚀 已成功由寄件者 [${senderName} <${senderEmail}>] 正式發出 Outlook 會議預約！已生成 Outlook 具名會議邀請檔 (.ics) 與網頁版日曆發送連結。`,
    sender: { email: senderEmail, name: senderName },
    icsContent,
    fileName: `履約里程碑會議邀請_${title}.ics`,
    outlookCalendarLink
  });
};

router.post('/send-outlook-meeting', handleOutlookMeetingDispatch);
router.post('/send-teams-outlook', handleOutlookMeetingDispatch);

module.exports = router;
