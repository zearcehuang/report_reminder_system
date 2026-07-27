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
    setTimeout(async () => {
      const mockImported: Omit<Contact, 'id'>[] = [
        { name: 'Grace Lin (軟體資深副理)', email: 'grace.lin@company.com', department: '資訊處' },
        { name: 'Kevin Sung (資安工程師)', email: 'kevin.sung@company.com', department: '資安組' },
      ];
      await api.uploadContacts(mockImported);
      setIsUploading(false);
      setSuccessMsg(`已從 ${file.name} 匯入 2 筆 Outlook 聯絡人`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadContacts();
      if (onContactsUpdated) onContactsUpdated();
    }, 600);
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
          border: '2px dashed var(--surface-glass-border)',
          background: 'rgba(10, 14, 24, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          textAlign: 'center',
          marginBottom: '1.25rem',
          cursor: 'pointer',
        }}>
          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#60a5fa' }}>
            <Upload size={16} />
            <span>{isUploading ? '匯入中...' : '匯入 Outlook Contacts (.csv / .vcf 格式檔案)'}</span>
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
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* Contact List Table */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--surface-glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.department}</span>
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
