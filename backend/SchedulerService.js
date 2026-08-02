const path = require('path');
const http = require('http');
const https = require('https');
const { readJsonSync, writeJsonSync } = require('./services/jsonStore');
const { formatDateISO, getPreviousWorkday } = require('./services/calendarService');

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
    const logs = readJsonSync(this.logsFile, []);
    return {
      isRunning: this.isRunning,
      schedulePattern: '每日 09:00 AM 自動稽核掃描',
      lastScanTime: this.lastScanTime,
      lastScanCount: this.lastScanCount,
      nextScheduledTime: this.nextScheduledTime,
      totalLogsCount: logs.length
    };
  }

  async runScanAndNotify() {
    const now = new Date();
    const todayStr = formatDateISO(now);

    this.lastScanTime = now.toISOString();

    const projects = readJsonSync(this.projectsFile, []);
    const holidays = readJsonSync(this.holidaysFile, []);
    const logs = readJsonSync(this.logsFile, []);

    let notifyCount = 0;

    for (const project of projects) {
      if (!project.rules || project.rules.length === 0) continue;
      const dDayStr = project.dDay;
      if (!dDayStr) continue;

      const dDay = new Date(dDayStr);

      for (const rule of project.rules) {
        try {
          if (!rule.enabled || rule.isCompleted) continue;

          const rawTarget = new Date(dDay);
          rawTarget.setDate(rawTarget.getDate() + rule.dayOffset);
          const rawTargetStr = formatDateISO(rawTarget);

          const adjustedTargetStr = getPreviousWorkday(rawTargetStr, holidays);

          const noticeDaysList = project.advanceNoticeDaysList || [project.advanceNoticeDays || 3];

          const triggerDates = noticeDaysList.map(days => {
            const dt = new Date(adjustedTargetStr);
            dt.setDate(dt.getDate() - days);
            return getPreviousWorkday(dt.toISOString().split('T')[0], holidays);
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
        } catch (ruleError) {
          console.error(`⚠️ Error scanning rule [${rule.id}] in project [${project.id}]:`, ruleError.message);
        }
      }
    }

    if (logs.length > 200) {
      logs.length = 200;
    }

    this.lastScanCount = notifyCount;
    writeJsonSync(this.logsFile, logs);

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
          },
          timeout: 30000
        }, (res) => {
          resolve(res.statusCode);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Teams Webhook request timed out after 30s'));
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
