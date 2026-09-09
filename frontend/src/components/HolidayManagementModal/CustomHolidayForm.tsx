import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface CustomHolidayFormProps {
  onAddCustom: (date: string, name: string, type: 'holiday' | 'workday') => Promise<void>;
}

export const CustomHolidayForm: React.FC<CustomHolidayFormProps> = ({ onAddCustom }) => {
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'holiday' | 'workday'>('holiday');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;
    setIsSubmitting(true);
    try {
      await onAddCustom(newDate, newName, newType);
      setNewDate('');
      setNewName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <select
        value={newType}
        onChange={(e) => setNewType(e.target.value as 'holiday' | 'workday')}
        className="input-glass"
        style={{ width: '130px', fontSize: '0.825rem', padding: '0.45rem 0.5rem' }}
      >
        <option value="holiday">🌴 國定假日</option>
        <option value="workday">💼 補班日</option>
      </select>
      <input
        type="date"
        className="input-glass"
        style={{ width: '160px' }}
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        required
      />
      <input
        type="text"
        className="input-glass"
        placeholder={
          newType === 'holiday'
            ? '自訂放假日名稱 (例: 公司創立紀念日)'
            : '自訂補班日說明 (例: 補春節連假彈性放假)'
        }
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-secondary"
        style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}
      >
        <Plus size={16} /> {isSubmitting ? '新增中...' : '新增'}
      </button>
    </form>
  );
};
