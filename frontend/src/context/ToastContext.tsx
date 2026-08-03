import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 99999 }}>
          <div className="bg-slate-800 text-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4 border border-white/10">
            <h3 className="text-lg font-medium mb-4">{confirmDialog.title}</h3>
            <p className="text-slate-300 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                onClick={() => {
                  confirmDialog.onCancel?.();
                  setConfirmDialog(null);
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
