import React, { useState, useEffect } from 'react';
import { UserItem, RoleItem, PermissionCode, UserSession } from '../types';
import { api } from '../services/api';
import { Shield, Users, X, AlertCircle, Sparkles } from 'lucide-react';
import { UserTabContent } from './UserPermissionModal/UserTabContent';
import { RoleTabContent } from './UserPermissionModal/RoleTabContent';
import { useToast } from '../hooks/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onUserUpdated?: () => void;
}

export const UserPermissionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userList = await api.getUsers();
      const roleList = await api.getRoles();
      setUsers(userList);
      setRoles(roleList);
    } catch (e: any) {
      setError('無法載入使用者與角色權限資料');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (!isOpen) return null;

  // --- USER HANDLERS ---
  const handleSaveUser = async (data: any, editingUserId?: string) => {
    if (!data.formName || !data.formEmail) {
      setError('請填寫姓名與 Email');
      return;
    }
    try {
      if (editingUserId) {
        const res = await api.updateUser(editingUserId, {
          name: data.formName,
          email: data.formEmail,
          password: data.formPassword || undefined,
          role: data.formRole,
          department: data.formDepartment,
          title: data.formTitle,
          status: data.formStatus,
        });
        if (res.success) {
          showNotification(`✅ 已成功更新使用者 ${data.formName}`);
        } else {
          setError(res.error || '更新失敗');
          return;
        }
      } else {
        const res = await api.createUser({
          name: data.formName,
          email: data.formEmail,
          password: data.formPassword || '123456',
          role: data.formRole,
          department: data.formDepartment,
          title: data.formTitle,
          status: data.formStatus,
        });
        if (res.success) {
          showNotification(`✅ 已成功建立新使用者 ${data.formName}`);
        } else {
          setError(res.error || '新增失敗');
          return;
        }
      }
      await loadData();
      if (onUserUpdated) onUserUpdated();
    } catch (e: any) {
      setError(e.message || '操作失敗');
    }
  };

  const handleToggleUserStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await api.updateUser(user.id, { status: nextStatus });
    if (res.success) {
      showNotification(`已切換 ${user.name} 狀態為 [${nextStatus === 'active' ? '啟用' : '停用'}]`);
      await loadData();
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    toast.confirm(
      '刪除使用者',
      `確定要刪除使用者「${name}」嗎？`,
      async () => {
        const ok = await api.deleteUser(id);
        if (ok) {
          showNotification(`已刪除使用者 ${name}`);
          toast.success(`已刪除使用者 ${name}`);
          await loadData();
        } else {
          toast.error('刪除使用者失敗');
        }
      }
    );
  };

  const handleBatchDeleteUsers = async (ids: string[]) => {
    toast.confirm(
      '批次刪除使用者',
      `確定要刪除選取的 ${ids.length} 位使用者嗎？`,
      async () => {
        const ok = await api.batchDeleteUsers(ids);
        if (ok) {
          showNotification(`已成功批次刪除 ${ids.length} 位使用者`);
          toast.success(`已成功批次刪除 ${ids.length} 位使用者`);
          await loadData();
        } else {
          toast.error('批次刪除使用者失敗');
        }
      }
    );
  };

  const handleImportContacts = async () => {
    const res = await api.importUsersFromContacts();
    if (res.success) {
      showNotification(`🚀 成功由通訊錄匯入/同步 ${res.addedCount} 位新使用者！`);
      await loadData();
    }
  };

  // --- ROLE HANDLERS ---
  const handleSaveRolePermissions = async (role: RoleItem, permissions: PermissionCode[]) => {
    const res = await api.updateRole(role.id, { permissions });
    if (res.success) {
      showNotification(`✅ 已成功更新角色 [${role.name}] 的權限矩陣`);
      await loadData();
    } else {
      setError(res.error || '更新權限失敗');
    }
  };

  const handleCreateRole = async (data: { name: string; description: string }) => {
    if (!data.name.trim()) {
      setError('請輸入新角色名稱');
      return;
    }
    const res = await api.createRole({
      name: data.name.trim(),
      description: data.description.trim() || '自訂專案角色群組',
      permissions: ['projects:read'],
    });

    if (res.success) {
      showNotification(`✅ 已成功建立自訂角色 [${data.name}]`);
      await loadData();
    } else {
      setError(res.error || '新增角色失敗');
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      toast.warning('無法刪除系統預設角色 (Admin/PM/Auditor)');
      return;
    }
    toast.confirm(
      '刪除角色',
      `確定要刪除自訂角色「${role.name}」嗎？`,
      async () => {
        const res = await api.deleteRole(role.id);
        if (res.success) {
          showNotification(`已刪除角色 ${role.name}`);
          toast.success(`已刪除角色 ${role.name}`);
          await loadData();
        } else {
          setError(res.error || '刪除角色失敗');
          toast.error(res.error || '刪除角色失敗');
        }
      }
    );
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '1050px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            }}>
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>使用者維護與角色群組授權管理中心</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                提供系統使用者帳號 CRUD、通訊錄快速同步，以及 Role vs Permission 權限矩陣動態控制
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> {successMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              color: activeTab === 'users' ? '#ffffff' : 'var(--text-secondary)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={18} /> 👤 使用者維護 ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            style={{
              background: activeTab === 'roles' ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              color: activeTab === 'roles' ? '#ffffff' : 'var(--text-secondary)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={18} /> 🛡️ 角色群組授權矩陣 ({roles.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <UserTabContent
            users={users}
            roles={roles}
            onSaveUser={handleSaveUser}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onBatchDeleteUsers={handleBatchDeleteUsers}
            onImportContacts={handleImportContacts}
          />
        )}

        {activeTab === 'roles' && (
          <RoleTabContent
            roles={roles}
            onSaveRolePermissions={handleSaveRolePermissions}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
          />
        )}
      </div>
    </div>
  );
};
