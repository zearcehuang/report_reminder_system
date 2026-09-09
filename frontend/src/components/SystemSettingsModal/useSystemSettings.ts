import { useState, useEffect } from 'react';
import { SystemSettings, GeminiTestResult, GeminiModelInfo } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_FALLBACK_MODELS } from './constants';

export const useSystemSettings = (isOpen: boolean, onSettingsSaved?: (settings: SystemSettings) => void) => {
  const { showSuccess, showError, showInfo } = useToast();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [autoUseGemini, setAutoUseGemini] = useState(true);
  const [temperature, setTemperature] = useState(0.2);

  const [availableModels, setAvailableModels] = useState<GeminiModelInfo[]>(DEFAULT_FALLBACK_MODELS);
  const [modelSource, setModelSource] = useState<'curated_defaults' | 'live_google_api' | string>('curated_defaults');
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<GeminiTestResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setTestResult(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      const configuredModel = data.geminiModel || 'gemini-2.0-flash';
      setSelectedModel(configuredModel);
      setAutoUseGemini(data.autoUseGemini !== undefined ? data.autoUseGemini : true);
      setTemperature(data.temperature !== undefined ? data.temperature : 0.2);
      setApiKeyInput('');

      await loadAvailableModels('', configuredModel);
    } catch {
      showError('載入系統設定失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableModels = async (keyOverride = '', currentModel = selectedModel) => {
    setIsFetchingModels(true);
    try {
      const res = await api.getAvailableGeminiModels(keyOverride);
      if (res && Array.isArray(res.models) && res.models.length > 0) {
        setAvailableModels(res.models);
        setModelSource(res.source);

        const targetModel = currentModel || selectedModel;
        const exists = res.models.some((m) => m.id === targetModel);
        if (!exists && targetModel && targetModel !== 'custom') {
          setIsCustomModel(true);
          setCustomModelId(targetModel);
        }
      }
    } catch {
      setAvailableModels(DEFAULT_FALLBACK_MODELS);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleRefreshModels = async () => {
    const candidateKey = apiKeyInput.trim();
    await loadAvailableModels(candidateKey, selectedModel);
    showInfo('已從 Google API 重新抓取可用模型清單');
  };

  const effectiveModel = isCustomModel ? (customModelId.trim() || 'gemini-2.0-flash') : selectedModel;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const candidateKey = apiKeyInput.trim();
      const result = await api.testGeminiConnection(candidateKey, effectiveModel);
      setTestResult(result);
      if (result.success) {
        showSuccess(`Gemini API 測試連線成功！(${result.latencyMs}ms)`);
        if (candidateKey) {
          await loadAvailableModels(candidateKey, effectiveModel);
        }
      } else {
        showError(result.error || 'Gemini API 連線失敗');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '連線測試發生未知異常';
      setTestResult({ success: false, error: errorMsg });
      showError('連線測試異常');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: { geminiApiKey?: string; geminiModel?: string; autoUseGemini?: boolean; temperature?: number } = {
        geminiModel: effectiveModel,
        autoUseGemini,
        temperature,
      };

      if (apiKeyInput.trim() !== '') {
        payload.geminiApiKey = apiKeyInput.trim();
      }

      const res = await api.updateSettings(payload);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setApiKeyInput('');
        showSuccess(res.message || '系統設定已安全加密儲存！');
        if (onSettingsSaved) {
          onSettingsSaved(res.settings);
        }
      } else {
        showError(res.error || '儲存設定失敗');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '儲存設定時發生錯誤';
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    apiKeyInput,
    setApiKeyInput,
    selectedModel,
    setSelectedModel,
    isCustomModel,
    setIsCustomModel,
    customModelId,
    setCustomModelId,
    autoUseGemini,
    setAutoUseGemini,
    temperature,
    setTemperature,
    availableModels,
    modelSource,
    isFetchingModels,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    effectiveModel,
    handleRefreshModels,
    handleTestConnection,
    handleSave,
  };
};
