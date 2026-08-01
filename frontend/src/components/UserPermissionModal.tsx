import React, { useState, useEffect } from 'react';
import { UserItem, RoleItem, PermissionCode, UserSession } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Check,
  X,
  Search,
  KeyRound,
  Download,
  AlertCircle,
  Plus,
  Save,
  CheckSquare,
  Square,
  Lock,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onUserUpdated?: () => void;
}

const PERMISSION_DEFINITIONS: { code: PermissionCode; name: string; category: string; description: string }[] = [
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

  // User tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  // User form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('PM');
  const [formDepartment, setFormDepartment] = useState('專案團隊');
  const [formTitle, setFormTitle] = useState('團隊成員');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Role matrix tab state
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [editedRolesMap, setEditedRolesMap] = useState<Record<string, PermissionCode[]>>({});

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

      // Initialize edited roles permission map
      const initialMap: Record<string, PermissionCode[]> = {};
      roleList.forEach(r => {
        initialMap[r.id] = [...(r.permissions || [])];
      });
      setEditedRolesMap(initialMap);
    } catch (e: any) {
      setError('無法載入使用者與角色權限資料');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- USER TAB HANDLERS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole(roles.length > 0 ? roles[0].name : 'PM');
    setFormDepartment('專案管理一部');
    setFormTitle('專案經理');
    setFormStatus('active');
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: UserItem) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormDepartment(user.department || '');
    setFormTitle(user.title || '');
    setFormStatus(user.status);
    setIsUserFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setError('請填寫姓名與 Email');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const res = await api.updateUser(editingUser.id, {
          name: formName,
          email: formEmail,
          password: formPassword || editingUser.password,
          role: formRole,
          department: formDepartment,
          title: formTitle,
          status: formStatus,
        });
        if (res.success) {
          showNotification(`✅ 已成功更新使用者 ${formName}`);
        } else {
          setError(res.error || '更新失敗');
          return;
        }
      } else {
        // Create user
        const res = await api.createUser({
          name: formName,
          email: formEmail,
          password: formPassword || '123456',
          role: formRole,
          department: formDepartment,
          title: formTitle,
          status: formStatus,
        });
        if (res.success) {
          showNotification(`✅ 已成功建立新使用者 ${formName}`);
        } else {
          setError(res.error || '新增失敗');
          return;
        }
      }
      setIsUserFormOpen(false);
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
    if (!window.confirm(`確定要刪除使用者「${name}」嗎？`)) return;
    const ok = await api.deleteUser(id);
    if (ok) {
      showNotification(`已刪除使用者 ${name}`);
      await loadData();
    }
  };

  const handleBatchDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selectedUserIds.length} 位使用者嗎？`)) return;
    const ok = await api.batchDeleteUsers(selectedUserIds);
    if (ok) {
      showNotification(`已成功批次刪除 ${selectedUserIds.length} 位使用者`);
      setSelectedUserIds([]);
      await loadData();
    }
  };

  const handleImportContacts = async () => {
    const res = await api.importUsersFromContacts();
    if (res.success) {
      showNotification(`🚀 成功由通訊錄匯入/同步 ${res.addedCount} 位新使用者！`);
      await loadData();
    }
  };

  // --- ROLE TAB HANDLERS ---
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

  const handleSaveRolePermissions = async (role: RoleItem) => {
    const permissions = editedRolesMap[role.id] || [];
    const res = await api.updateRole(role.id, { permissions });
    if (res.success) {
      showNotification(`✅ 已成功更新角色 [${role.name}] 的權限矩陣`);
      await loadData();
    } else {
      setError(res.error || '更新權限失敗');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setError('請輸入新角色名稱');
      return;
    }
    const res = await api.createRole({
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || '自訂專案角色群組',
      permissions: ['projects:read'],
    });

    if (res.success) {
      showNotification(`✅ 已成功建立自訂角色 [${newRoleName}]`);
      setNewRoleName('');
      setNewRoleDesc('');
      setIsRoleFormOpen(false);
      await loadData();
    } else {
      setError(res.error || '新增角色失敗');
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      alert('無法刪除系統預設角色 (Admin/PM/Auditor)');
      return;
    }
    if (!window.confirm(`確定要刪除自訂角色「${role.name}」嗎？`)) return;
    const res = await api.deleteRole(role.id);
    if (res.success) {
      showNotification(`已刪除角色 ${role.name}`);
      await loadData();
    } else {
      setError(res.error || '刪除角色失敗');
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const getRoleBadgeStyle = (roleName: string) => {
    if (roleName === 'Admin') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    if (roleName === 'PM') return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    if (roleName === 'Auditor') return { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
    return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '1050px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
        {/* Header */}
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

        {/* Global Notifications */}
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

        {/* Tabs */}
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

        {/* TAB 1: USER MAINTENANCE */}
        {activeTab === 'users' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-glass"
                  style={{ width: '100%', paddingLeft: '2.3rem', fontSize: '0.85rem' }}
                  placeholder="搜尋姓名、Email、部門或角色..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectedUserIds.length > 0 && (
                  <button className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={handleBatchDeleteUsers}>
                    <Trash2 size={15} /> 刪除選取 ({selectedUserIds.length})
                  </button>
                )}

                <button className="btn-secondary" onClick={handleImportContacts} title="由 Outlook 企業通訊錄中一鍵自動建立使用者帳號">
                  <Download size={15} /> 從通訊錄一鍵同步
                </button>

                <button className="btn-primary" onClick={handleOpenCreateUser}>
                  <UserPlus size={16} /> 新增使用者
                </button>
              </div>
            </div>

            {/* User List Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-md)', background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem', width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds(filteredUsers.map(u => u.id));
                          else setSelectedUserIds([]);
                        }}
                      />
                    </th>
                    <th style={{ padding: '0.75rem' }}>使用者姓名與帳號</th>
                    <th style={{ padding: '0.75rem' }}>部門 / 職稱</th>
                    <th style={{ padding: '0.75rem' }}>指派角色</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>帳號狀態</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>操作項</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        尚未找到符合條件的使用者帳號
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const badge = getRoleBadgeStyle(u.role);
                      const isSelected = selectedUserIds.includes(u.id);

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0', background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                                else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                              }}
                            />
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <div>{u.department || '通用團隊'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.title || '成員'}</div>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              {u.role}
                            </span>
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              style={{
                                background: u.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: u.status === 'active' ? '#34d399' : '#f87171',
                                border: `1px solid ${u.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {u.status === 'active' ? <UserCheck size={13} /> : <UserX size={13} />}
                              {u.status === 'active' ? '啟用中' : '已停用'}
                            </button>
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button className="btn-icon" title="編輯使用者" onClick={() => handleOpenEditUser(u)}>
                                <Edit size={15} />
                              </button>
                              <button className="btn-icon" title="刪除使用者" style={{ color: '#f87171' }} onClick={() => handleDeleteUser(u.id, u.name)}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Create/Edit User Form Drawer Modal */}
            {isUserFormOpen && (
              <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="glass-modal width-full animate-fade-in" style={{ maxWidth: '520px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {editingUser ? `編輯使用者：${editingUser.name}` : '➕ 新增系統使用者'}
                    </h3>
                    <button className="btn-icon" onClick={() => setIsUserFormOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>姓名 *</label>
                        <input
                          type="text"
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder="例如: 張小明"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email 帳號 *</label>
                        <input
                          type="email"
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder="alex@company.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>密碼 / 重設密碼</label>
                        <input
                          type="password"
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder={editingUser ? '保持空白表示不變更' : '預設 123456'}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>指派角色群組</label>
                        <select
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name} ({r.description})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>所屬部門</label>
                        <input
                          type="text"
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder="例如: 專案管理一部"
                          value={formDepartment}
                          onChange={(e) => setFormDepartment(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>職稱</label>
                        <input
                          type="text"
                          className="input-glass"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder="例如: 專案經理"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setIsUserFormOpen(false)}>
                        取消
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingUser ? '儲存更新' : '建立使用者'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROLE & PERMISSION MATRIX */}
        {activeTab === 'roles' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                💡 在矩陣表中勾選各角色可存取之功能權限點，點擊下方「儲存權限矩陣」即可即時套用。
              </div>

              <button className="btn-primary" onClick={() => setIsRoleFormOpen(true)}>
                <Plus size={16} /> 新增自訂角色
              </button>
            </div>

            {/* Matrix Table */}
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
                                onClick={() => handleDeleteRole(r)}
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

            {/* Matrix Footer Save Action */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {roles.map(r => (
                <button
                  key={r.id}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  onClick={() => handleSaveRolePermissions(r)}
                >
                  <Save size={14} /> 儲存【{r.name}】權限設定
                </button>
              ))}
            </div>

            {/* Create Custom Role Dialog */}
            {isRoleFormOpen && (
              <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="glass-modal width-full animate-fade-in" style={{ maxWidth: '460px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>➕ 新增自訂角色群組</h3>
                    <button className="btn-icon" onClick={() => setIsRoleFormOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRole}>
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>角色代號 / 名稱 *</label>
                      <input
                        type="text"
                        className="input-glass"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        placeholder="例如: QA_Leader"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>角色描述</label>
                      <textarea
                        className="input-glass"
                        style={{ width: '100%', fontSize: '0.85rem', height: '70px' }}
                        placeholder="請簡述此角色的職責與權限範圍..."
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setIsRoleFormOpen(false)}>
                        取消
                      </button>
                      <button type="submit" className="btn-primary">
                        建立角色
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
