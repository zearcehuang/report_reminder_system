import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  return {
    showSuccess: (msg: string) => context?.addToast('success', msg),
    showError: (msg: string) => context?.addToast('error', msg),
    showWarning: (msg: string) => context?.addToast('warning', msg),
    showInfo: (msg: string) => context?.addToast('info', msg),
    addToast: context?.addToast,
    confirm: context?.confirm,
  };
};

export const toastManager = {
  addToast: (type: ToastType, message: string) => {
    console.warn('ToastProvider not mounted:', message, type);
  },
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; id: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  const confirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmDialog({ title, message, onConfirm, onCancel });
  };

  toastManager.addToast = addToast;

  return (
    <ToastContext.Provider value={{ addToast, confirm }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="glass-modal animate-fade-in" style={{ padding: '1.75rem', maxWidth: '440px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 700 }}>
              {confirmDialog.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                onClick={() => {
                  confirmDialog.onCancel?.();
                  setConfirmDialog(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  cb();
                }}
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
