import React, { useState } from 'react';
import { UserItem, RoleItem } from '../../types';
import { Search, Trash2, Download, UserPlus, UserCheck, UserX, Edit } from 'lucide-react';
import { getRoleBadgeStyle } from '../../constants/permissionConstants';
import { UserFormModal } from './UserFormModal';

interface UserTabContentProps {
  users: UserItem[];
  roles: RoleItem[];
  onToggleUserStatus: (user: UserItem) => Promise<void>;
  onDeleteUser: (id: string, name: string) => Promise<void>;
  onBatchDeleteUsers: (ids: string[]) => Promise<void>;
  onImportContacts: () => Promise<void>;
  onSaveUser: (data: any, editingUserId?: string) => Promise<void>;
}

export const UserTabContent: React.FC<UserTabContentProps> = ({
  users,
  roles,
  onToggleUserStatus,
  onDeleteUser,
  onBatchDeleteUsers,
  onImportContacts,
  onSaveUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: UserItem) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleSave = async (data: any) => {
    await onSaveUser(data, editingUser?.id);
    setIsUserFormOpen(false);
  };

  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selectedUserIds.length} 位使用者嗎？`)) return;
    await onBatchDeleteUsers(selectedUserIds);
    setSelectedUserIds([]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <button type="button" className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={handleBatchDelete}>
              <Trash2 size={15} /> 刪除選取 ({selectedUserIds.length})
            </button>
          )}

          <button type="button" className="btn-secondary" onClick={onImportContacts} title="由 Outlook 企業通訊錄中一鍵自動建立使用者帳號">
            <Download size={15} /> 從通訊錄一鍵同步
          </button>

          <button type="button" className="btn-primary" onClick={handleOpenCreateUser}>
            <UserPlus size={16} /> 新增使用者
          </button>
        </div>
      </div>

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
                        onClick={() => onToggleUserStatus(u)}
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
                        <button className="btn-icon" title="刪除使用者" style={{ color: '#f87171' }} onClick={() => onDeleteUser(u.id, u.name)}>
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

      <UserFormModal
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        editingUser={editingUser}
        roles={roles}
        onSave={handleSave}
      />
    </div>
  );
};
