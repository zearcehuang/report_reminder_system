import React, { useState, useRef } from 'react';
import { DocumentExtractResult } from '../types';
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  projectDDay: string;
  onExtractSuccess: (result: DocumentExtractResult) => void;
}

export const DocumentUploader: React.FC<Props> = ({ projectDDay, onExtractSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    // Validate file extensions
    const validExtensions = ['.docx', '.pdf', '.xlsx', '.xls', '.csv', '.txt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert('請上傳支援的合約/標案文件格式 (.docx, .pdf, .xlsx, .xls, .csv, .txt)');
      return;
    }

    setIsUploading(true);
    setCurrentFileName(file.name);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      const result = await api.extractDocumentMilestones(file, projectDDay);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onExtractSuccess(result);
      }, 400);
    } catch {
      clearInterval(interval);
      setIsUploading(false);
      alert('解析檔案失敗，請再試一次');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-secondary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>合約/標案文件智能上傳與關鍵日期解析</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              拖曳上傳專案合約或工作任務說明書 (RFP/SOW)，系統自動提煉繳交死線與工作項目
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['.docx', '.pdf', '.xlsx', '.csv', '.txt'].map((ext) => (
            <span key={ext} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--surface-glass-border)',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}>
              {ext}
            </span>
          ))}
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--accent-secondary)' : '2px dashed rgba(203, 213, 225, 0.9)',
          background: isDragging ? 'rgba(6, 182, 212, 0.08)' : 'rgba(241, 245, 249, 0.6)',
          borderRadius: 'var(--radius-md)',
          padding: '2.25rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.xlsx,.xls,.csv,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleProcessFile(e.target.files[0]);
            }
          }}
        />

        {!isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.9rem',
              borderRadius: '50%',
              display: 'flex',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <UploadCloud size={32} color="var(--accent-secondary)" />
            </div>

            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                點擊此處選擇檔案 或 將專案合約文件拖曳至此
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                支援 .docx, .pdf, .xlsx, .csv, .txt 等標案規範與履約說明文件
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
            <Loader2 size={30} className="animate-spin" color="var(--accent-secondary)" />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              正在提取專案死線與關鍵報告: <span style={{ color: 'var(--accent-secondary)' }}>{currentFileName}</span>
            </div>

            <div style={{ width: '60%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'var(--accent-gradient)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
