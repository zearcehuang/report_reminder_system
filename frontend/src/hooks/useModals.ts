import { useState, useCallback } from 'react';

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  return { isOpen, open, close, toggle, setIsOpen };
}

export function useAppModals() {
  const projectManager = useModal();
  const holiday = useModal();
  const contact = useModal();
  const errorLog = useModal();
  const addReport = useModal();
  const schedulerLog = useModal();
  const userAuth = useModal();
  const userPermission = useModal();
  const editReport = useModal();
  const documentPreview = useModal();
  const systemSettings = useModal();

  return {
    projectManager,
    holiday,
    contact,
    errorLog,
    addReport,
    schedulerLog,
    userAuth,
    userPermission,
    editReport,
    documentPreview,
    systemSettings
  };
}
