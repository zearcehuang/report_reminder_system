import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { Users, X, Upload, Plus, Check, Mail, User, Briefcase } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContactsUpdated?: () => void;
}

export const ContactImportModal: React.FC<Props> = ({ isOpen, onClose, onContactsUpdated }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    const list = await api.getContacts();
    setContacts(list);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    await api.uploadContacts([{ name, email, department: department || '專案組' }]);
    setName('');
    setEmail('');
    setDepartment('');
    setSuccessMsg('已新增聯絡人');
    setTimeout(() => setSuccessMsg(null), 2500);
    await loadContacts();
    if (onContactsUpdated) onContactsUpdated();
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await api.importContactsFile(file);
      setIsUploading(false);
      const count = result.addedCount ?? result.contacts?.length ?? 0;
      setSuccessMsg(`已成功從 ${file.name} 匯入 ${count} 筆 Outlook 聯絡人！`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadContacts();
      if (onContactsUpdated) onContactsUpdated();
    } catch {
      setIsUploading(false);
      setSuccessMsg('匯入失敗，請確認檔案格式是否為 Outlook CSV/vCard');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '720px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}>
              <Users size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Outlook 通訊錄匯入與權責成員管理</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                支援 CSV / vCard 自動整合，供里程碑 Tag 自動補全選取
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Upload dropzone mini */}
        <div style={{
          border: '2px dashed #cbd5e1',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          marginBottom: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.background = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.background = '#f8fafc';
        }}
        >
          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#2563eb', fontWeight: 600 }}>
            <Upload size={18} />
            <span>{isUploading ? '匯入處理中...' : '點擊或拖曳匯入 Outlook Contacts (.csv / .vcf 檔案)'}</span>
            <input
              type="file"
              accept=".csv,.vcf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </label>
        </div>

        {/* Manual Add Form */}
        <form onSubmit={handleAddContact} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr auto', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="input-glass"
            placeholder="姓名/職稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="input-glass"
            placeholder="Outlook Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-glass"
            placeholder="部門"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Plus size={16} /> 新增
          </button>
        </form>

        {successMsg && (
          <div className="animate-fade-in" style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '0.6rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Check size={18} /> {successMsg}
          </div>
        )}

        {/* Contact List Table */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                }}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>{c.email}</div>
                </div>
              </div>

              {c.department && (
                <span style={{
                  fontSize: '0.725rem',
                  color: '#4338ca',
                  background: '#e0e7ff',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {c.department}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
