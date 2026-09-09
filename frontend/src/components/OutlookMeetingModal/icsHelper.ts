import { ScheduleItem, Project, SenderAccount } from '../../types';

export const generateIcsBlobAndFileName = (
  scheduleItem: ScheduleItem | null,
  project: Project,
  activeSender: SenderAccount | null,
  senderEmail: string,
  senderName: string,
  customNote: string
) => {
  if (!scheduleItem) return { blob: new Blob(), fileName: '', icsLines: '' };
  const effectiveDueDate = scheduleItem.calculatedDate || new Date().toISOString().split('T')[0];
  const nowClean = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const meetingDateStr = effectiveDueDate.replace(/-/g, '');
  const dtStart = `${meetingDateStr}T090000Z`;
  const dtEnd = `${meetingDateStr}T100000Z`;
  const ownerListStr = Array.isArray(scheduleItem.owners)
    ? scheduleItem.owners.join(', ')
    : '專案團隊';
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
    (e) =>
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="${
        e.split('@')[0]
      }":mailto:${e}`
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
    `DESCRIPTION:專案名稱: ${project.name}\\n報告死線: ${effectiveDueDate}\\n受邀負責人: ${ownerListStr}\\n發布寄件者: ${organizerName} (${organizerEmail})\\n\\n備註: ${
      customNote || '請承辦同仁於死線前完成報告編製與審查'
    }`,
    `ORGANIZER;CN="${organizerName}":mailto:${organizerEmail}`,
    ...attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8;' });
  const fileName = `履約里程碑會議邀請_${scheduleItem.title}.ics`;
  return { blob, fileName, icsLines };
};
