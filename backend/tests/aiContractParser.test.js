const AiContractParser = require('../AiContractParser');
const fs = require('fs');
const path = require('path');

describe('AiContractParser', () => {
  const sampleText = `
    專案詳細執行計畫書需於簽約後 D+30 日內提交。
    系統架構設計規格書應於 D+60 日提交。
    教育訓練手冊預計在 D+120 日完成。
  `;

  beforeEach(() => {
    // Save original env vars
    process.env.ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    process.env.ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    // Restore original env vars
    process.env.OPENAI_API_KEY = process.env.ORIGINAL_OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = process.env.ORIGINAL_GEMINI_API_KEY;
    jest.restoreAllMocks();
  });

  it('should fallback to heuristic parsing when no API keys are present', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await AiContractParser.parseWithLlm(sampleText, 'test.docx');
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('計畫書');
  });

  it('should call OpenAI API when OPENAI_API_KEY is present', async () => {
    process.env.OPENAI_API_KEY = 'test_openai_key';
    delete process.env.GEMINI_API_KEY;

    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            milestones: [
              { title: 'Mocked Plan', dayOffset: 45, deliverables: ['doc1'], penaltyTerms: 'none', clauseReference: 'clause 1' }
            ]
          })
        }
      }]
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const result = await AiContractParser.parseWithLlm(sampleText, 'test.docx');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Mocked Plan');
    expect(result[0].dayOffset).toBe(45);
  });

  it('should fallback to heuristic parsing if OpenAI API fails', async () => {
    process.env.OPENAI_API_KEY = 'test_openai_key';
    delete process.env.GEMINI_API_KEY;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    const result = await AiContractParser.parseWithLlm(sampleText, 'test.docx');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('計畫書');
  });
});
