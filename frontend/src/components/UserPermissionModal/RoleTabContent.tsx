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

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-md)', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
              <th style={{ padding: '0.75rem 1rem', width: '180px' }}>功能分類 / 權限點</th>
              <th style={{ padding: '0.75rem 1rem' }}>說明</th>
              {roles.map((r) => {
                const badge = getRoleBadgeStyle(r.name);
                return (
                  <th key={r.id} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <span style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        fontSize: '0.775rem',
                      }}>
                        {r.name}
                      </span>
                      {!r.isSystem && (
                        <button
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

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {roles.map(r => (
          <button
            key={r.id}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            onClick={() => handleSave(r)}
          >
            <Save size={14} /> 儲存【{r.name}】權限設定
          </button>
        ))}
      </div>

      <CreateRoleModal
        isOpen={isRoleFormOpen}
        onClose={() => setIsRoleFormOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};
