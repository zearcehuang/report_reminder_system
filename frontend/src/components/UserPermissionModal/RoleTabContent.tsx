import React, { useState, useEffect } from 'react';
import { RoleItem, PermissionCode } from '../../types';
import { Plus, Save, CheckSquare, Square } from 'lucide-react';
import { PERMISSION_DEFINITIONS, getRoleBadgeStyle } from '../../constants/permissionConstants';
import { CreateRoleModal } from './CreateRoleModal';

interface RoleTabContentProps {
  roles: RoleItem[];
  onSaveRolePermissions: (role: RoleItem, permissions: PermissionCode[]) => Promise<void>;
  onCreateRole: (roleData: { name: string; description: string }) => Promise<void>;
  onDeleteRole: (role: RoleItem) => Promise<void>;
}

export const RoleTabContent: React.FC<RoleTabContentProps> = ({
  roles,
  onSaveRolePermissions,
  onCreateRole,
  onDeleteRole,
}) => {
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editedRolesMap, setEditedRolesMap] = useState<Record<string, PermissionCode[]>>({});
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  useEffect(() => {
    const initialMap: Record<string, PermissionCode[]> = {};
    roles.forEach(r => {
      initialMap[r.id] = [...(r.permissions || [])];
    });
    setEditedRolesMap(initialMap);
  }, [roles]);

  const handleTogglePermission = (roleId: string, permCode: PermissionCode) => {
    const currentPerms = editedRolesMap[roleId] || [];
    let updatedPerms: PermissionCode[];
    if (currentPerms.includes(permCode)) {
      updatedPerms = currentPerms.filter(p => p !== permCode);
    } else {
      updatedPerms = [...currentPerms, permCode];
    }
    setEditedRolesMap({
      ...editedRolesMap,
      [roleId]: updatedPerms,
    });
  };

  const handleSave = async (role: RoleItem) => {
    const permissions = editedRolesMap[role.id] || [];
    await onSaveRolePermissions(role, permissions);
  };

  const handleToggleSelectRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const handleSelectAllRoles = (checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(roles.map(r => r.id));
    } else {
      setSelectedRoleIds([]);
    }
  };

  const handleSaveSelectedRoles = async () => {
    if (selectedRoleIds.length === 0) return;
    setIsSavingBatch(true);
    try {
      const targetRoles = roles.filter(r => selectedRoleIds.includes(r.id));
      for (const role of targetRoles) {
        const permissions = editedRolesMap[role.id] || [];
        await onSaveRolePermissions(role, permissions);
      }
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      for (const role of roles) {
        const permissions = editedRolesMap[role.id] || [];
        await onSaveRolePermissions(role, permissions);
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCreate = async (data: { name: string; description: string }) => {
    await onCreateRole(data);
    setIsRoleFormOpen(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          💡 在矩陣表中勾選各角色可存取之功能權限點，點擊下方「儲存權限矩陣」即可即時套用。
        </div>

        <button className="btn-primary" onClick={() => setIsRoleFormOpen(true)}>
          <Plus size={16} /> 新增自訂角色
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-md)', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
              <th style={{ padding: '0.75rem 1rem', width: '180px', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.length > 0 && selectedRoleIds.length === roles.length}
                    onChange={(e) => handleSelectAllRoles(e.target.checked)}
                    title="全選 / 取消全選所有身分"
                    style={{ cursor: 'pointer' }}
                  />
                  <span>功能分類 / 權限點</span>
                </div>
              </th>
              <th style={{ padding: '0.75rem 1rem', minWidth: '220px' }}>說明</th>
              {roles.map((r) => {
                const badge = getRoleBadgeStyle(r.name);
                const isSelected = selectedRoleIds.includes(r.id);
                return (
                  <th key={r.id} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', minWidth: '140px', background: isSelected ? 'rgba(99, 102, 241, 0.06)' : 'transparent' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRole(r.id)}
                          title={`勾選【${r.name}】身分以進行多選批次儲存`}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          whiteSpace: 'nowrap',
                        }}>
                          {r.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSave(r)}
                        className="btn-primary"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}
                        title={`單獨儲存【${r.name}】的權限變更`}
                      >
                        <Save size={12} /> 儲存
                      </button>
                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={() => onDeleteRole(r)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', marginTop: '0.1rem' }}
                        >
                          刪除角色
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_DEFINITIONS.map((perm, idx) => (
              <tr key={perm.code} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)' }}>{perm.category}</div>
                  {perm.name}
                </td>

                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                  {perm.description}
                </td>

                {roles.map((role) => {
                  const rolePerms = editedRolesMap[role.id] || [];
                  const hasPerm = role.name === 'Admin' || rolePerms.includes(perm.code);
                  const isDisabled = role.name === 'Admin'; // Admin always has full access

                  return (
                    <td key={role.id} style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <button
                        disabled={isDisabled}
                        onClick={() => handleTogglePermission(role.id, perm.code)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.7 : 1,
                        }}
                      >
                        {hasPerm ? (
                          <CheckSquare size={20} color="#059669" />
                        ) : (
                          <Square size={20} color="#cbd5e1" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={handleSaveAll}
            disabled={isSavingAll || isSavingBatch}
          >
            <Save size={16} /> {isSavingAll ? '全角色儲存中...' : '⚡ 一鍵儲存全部身分權限'}
          </button>

          {selectedRoleIds.length > 0 && (
            <button
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              onClick={handleSaveSelectedRoles}
              disabled={isSavingAll || isSavingBatch}
            >
              <CheckSquare size={16} /> {isSavingBatch ? '勾選身分儲存中...' : `☑️ 儲存勾選身分 (${selectedRoleIds.length})`}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxHeight: '100px', overflowY: 'auto' }}>
          {roles.map(r => {
            const isSelected = selectedRoleIds.includes(r.id);
            return (
              <button
                key={r.id}
                className={isSelected ? "btn-primary" : "btn-secondary"}
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => handleSave(r)}
              >
                <Save size={13} /> 儲存【{r.name}】
              </button>
            );
          })}
        </div>
      </div>

      <CreateRoleModal
        isOpen={isRoleFormOpen}
        onClose={() => setIsRoleFormOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};
