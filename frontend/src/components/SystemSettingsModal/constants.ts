import { GeminiModelInfo } from '../../types';

export const DEFAULT_FALLBACK_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    description: '最新世代極速多模態與高精準結構化解析 (最推薦)',
    isRecommended: true,
    isLatest: true,
  },
  {
    id: 'gemini-3.6-flash',
    name: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    description: '新一代高效能文字與多模態模型',
    isLatest: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: '高效穩定多模態文字模型',
    isRecommended: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: '複雜長合約深度邏輯推論',
    isRecommended: false,
  },
  {
    id: 'gemini-flash-latest',
    name: 'gemini-flash-latest',
    displayName: 'Gemini Flash (自動最新版)',
    description: '自動綁定 Google 雲端當前最新發布之 Flash 模型',
    isRecommended: false,
    isLatest: true,
  },
];
