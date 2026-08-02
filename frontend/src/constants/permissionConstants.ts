import { PermissionCode } from '../types';

export const PERMISSION_DEFINITIONS: { code: PermissionCode; name: string; category: string; description: string }[] = [
  { code: 'projects:read', name: '專案與里程碑檢視', category: '專案與履約報告', description: '允許檢視所有專案詳細內容與時間軸報告' },
  { code: 'projects:write', name: '專案與 D-Day 編輯', category: '專案與履約報告', description: '允許建立新專案、修改開工日及變更團隊成員' },
  { code: 'projects:delete', name: '專案刪除管理', category: '專案與履約報告', description: '允許單一與批次刪除專案資料 (高權限敏感操作)' },
  { code: 'rules:write', name: '里程碑規則維護', category: '專案與履約報告', description: '允許新增、修改與刪除履約里程碑報告規則' },
  { code: 'schedules:submit', name: '報告繳交狀態切換', category: '專案與履約報告', description: '允許標記履約報告為已繳交/未繳交狀態' },
  { code: 'notifications:send', name: 'Outlook / Teams 發布', category: '通知與會議', description: '允許發布 Outlook 會議預約與 Teams 提醒通知' },
  { code: 'holidays:manage', name: '國定假日與補班日管理', category: '系統組態管理', description: '允許維護與同步 DGPA 國定假日及補班日資料' },
  { code: 'contacts:manage', name: '企業通訊錄管理', category: '系統組態管理', description: '允許上傳與匯入 Outlook 企業成員通訊錄' },
  { code: 'system:admin', name: '系統權限與使用者維護', category: '系統組態管理', description: '最高管理員權限，可管理所有使用者帳號與角色群組授權' },
];

export const getRoleBadgeStyle = (roleName: string) => {
  if (roleName === 'Admin') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
  if (roleName === 'PM') return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
  if (roleName === 'Auditor') return { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
  return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
};
