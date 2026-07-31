const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class SchedulerService {
  constructor(dataDir) {
    this.dataDir = dataDir || path.join(__dirname, '..', 'data');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
    this.holidaysFile = path.join(this.dataDir, 'holidays.json');
    this.logsFile = path.join(this.dataDir, 'notification_logs.json');

    this.timer = null;
    this.lastScanTime = null;
    this.lastScanCount = 0;
    this.nextScheduledTime = null;
    this.isRunning = false;
  }

  readJson(filePath, defaultValue) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return defaultValue;
  }

  writeJson(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error writing ${filePath}:`, e);
    }
  }

  start() {
    this.isRunning = true;
    this.scheduleNextRun();
    console.log('⏰ Automated Background Scheduler started (Daily check at 09:00 AM)');
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
    console.log('⏰ Automated Background Scheduler stopped');
  }

  scheduleNextRun() {
    const now = new Date();
    const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    this.nextScheduledTime = nextRun.toISOString();
    const delay = nextRun.getTime() - now.getTime();

    this.timer = setTimeout(async () => {
      if (this.isRunning) {
        await this.runScanAndNotify();
        this.scheduleNextRun();
      }
    }, delay);
  }

  getStatus() {
    const logs = this.readJson(this.logsFile, []);
    return {
      isRunning: this.isRunning,
      schedulePattern: '每日 09:00 AM 自動稽核掃描',
      lastScanTime: this.lastScanTime,
      lastScanCount: this.lastScanCount,
      nextScheduledTime: this.nextScheduledTime,
      totalLogsCount: logs.length
    };
  }

  isWorkday(dateStr, holidays) {
    const hRecord = holidays.find(h => h.date === dateStr);
    if (hRecord) {
      return hRecord.isWorkday === true || hRecord.isHoliday === false;
    }
    const date = new Date(dateStr);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  }

  getPreviousWorkday(dateStr, holidays) {
    let curr = new Date(dateStr);
    while (true) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      if (this.isWorkday(iso, holidays)) {
        return iso;
      }
      curr.setDate(curr.getDate() - 1);
    }
  }

  async runScanAndNotify() {
    const now = new Date();
    const todayYyyy = now.getFullYear();
    const todayMm = String(now.getMonth() + 1).padStart(2, '0');
    const todayDd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayYyyy}-${todayMm}-${todayDd}`;

    this.lastScanTime = now.toISOString();

    const projects = this.readJson(this.projectsFile, []);
    const holidays = this.readJson(this.holidaysFile, []);
    const logs = this.readJson(this.logsFile, []);

    let notifyCount = 0;

    for (const project of projects) {
      if (!project.rules || project.rules.length === 0) continue;
      const dDayStr = project.dDay;
      if (!dDayStr) continue;

      const dDay = new Date(dDayStr);

      for (const rule of project.rules) {
        if (!rule.enabled || rule.isCompleted) continue;

        // Raw target date
        const rawTarget = new Date(dDay);
        rawTarget.setDate(rawTarget.getDate() + rule.dayOffset);
        const rawY = rawTarget.getFullYear();
        const rawM = String(rawTarget.getMonth() + 1).padStart(2, '0');
        const rawD = String(rawTarget.getDate()).padStart(2, '0');
        const rawTargetStr = `${rawY}-${rawM}-${rawD}`;

        // Adjusted target business date after holidays
        const adjustedTargetStr = this.getPreviousWorkday(rawTargetStr, holidays);

        // Advance notice days list (e.g. [1, 3, 7, 14])
        const noticeDaysList = project.advanceNoticeDaysList || [project.advanceNoticeDays || 3];

        // Calculate notice trigger dates
        const triggerDates = noticeDaysList.map(days => {
          const dt = new Date(adjustedTargetStr);
          dt.setDate(dt.getDate() - days);
          return this.getPreviousWorkday(dt.toISOString().split('T')[0], holidays);
        });

        const isOverdue = todayStr > adjustedTargetStr;
        const isTriggerDay = triggerDates.includes(todayStr) || todayStr === adjustedTargetStr;

        if (isTriggerDay || isOverdue) {
          notifyCount++;

          const logItem = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            projectId: project.id,
            projectCode: project.projectCode || 'PRJ',
            projectName: project.projectName || '專案',
            ruleId: rule.id,
            reportTitle: rule.title,
            deadlineDate: adjustedTargetStr,
            owners: rule.owners || [],
            triggerType: isOverdue ? 'Overdue' : (todayStr === adjustedTargetStr ? 'DueToday' : 'AdvanceNotice'),
            status: 'Success',
            channel: project.teamsWebhookUrl ? 'Teams+Outlook' : 'Outlook',
            message: isOverdue 
              ? `⚠️ 報告 [${rule.title}] 已逾期 (原定死線: ${adjustedTargetStr})`
              : `🔔 報告 [${rule.title}] 預警提醒 (死線: ${adjustedTargetStr})`
          };

          // Dispatch MS Teams Webhook if URL exists
          if (project.teamsWebhookUrl) {
            try {
              await this.sendTeamsWebhook(project.teamsWebhookUrl, logItem);
            } catch (err) {
              logItem.status = 'PartialFailed';
              logItem.message += ` (Teams Webhook 發送失敗: ${err.message})`;
            }
          }

          logs.unshift(logItem);
        }
      }
    }

    // Keep up to 200 logs
    if (logs.length > 200) {
      logs.length = 200;
    }

    this.lastScanCount = notifyCount;
    this.writeJson(this.logsFile, logs);

    console.log(`⏰ Background Scheduler Scan Completed: ${notifyCount} notification(s) generated.`);
    return { scanTime: this.lastScanTime, notifyCount, totalLogs: logs.length };
  }

  sendTeamsWebhook(webhookUrl, logItem) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(webhookUrl);
        const postData = JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": logItem.triggerType === 'Overdue' ? "FF0000" : "0076D7",
          "summary": logItem.message,
          "sections": [{
            "activityTitle": `📊 履約報告提醒: ${logItem.reportTitle}`,
            "activitySubtitle": `專案: ${logItem.projectName} (${logItem.projectCode})`,
            "facts": [
              { "name": "報告死線", "value": logItem.deadlineDate },
              { "name": "受邀負責人", "value": logItem.owners.join(', ') || '全體同仁' },
              { "name": "通知狀態", "value": logItem.message }
            ],
            "markdown": true
          }]
        });

        const client = urlObj.protocol === 'https:' ? https : http;
        const req = client.request(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          resolve(res.statusCode);
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = SchedulerService;
