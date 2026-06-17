import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();
    service = module.get<AiService>(AiService);
  });

  it('should return parsed AI result on success', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'DEV', intent: 'CODE_REVIEW', summary: 'A PR.', dynamic_tags: ['ts'] }) } }],
    });
    const result = await service.analyzeLink({ url: 'https://github.com/x/y/pull/1', rawTextSample: 'code', contextText: 'review' });
    expect(result.category).toBe('DEV');
    expect(result.intent).toBe('CODE_REVIEW');
  });

  it('should return fallback on OpenAI error', async () => {
    mockCreate.mockRejectedValue(new Error('rate limit'));
    const result = await service.analyzeLink({ url: 'https://x.com', rawTextSample: '', contextText: '' });
    expect(result.category).toBe('ARTICLE');
    expect(result.intent).toBe('GENERAL');
  });

  it('should return fallback on JSON parse error', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'not json' } }] });
    const result = await service.analyzeLink({ url: 'https://x.com', rawTextSample: '', contextText: '' });
    expect(result.summary).toBeDefined();
  });

  it('should return empty dynamic_tags in fallback', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));
    const result = await service.analyzeLink({ url: 'https://x.com', rawTextSample: '', contextText: '' });
    expect(result.dynamic_tags).toEqual([]);
  });

  it('should pass system prompt to OpenAI', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'ARTICLE', intent: 'TO_READ', summary: 'S', dynamic_tags: [] }) } }],
    });
    await service.analyzeLink({ url: 'https://x.com', rawTextSample: 'text', contextText: 'ctx' });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].role).toBe('system');
  });

  it('should use gpt-4o-mini model', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'ARTICLE', intent: 'TO_READ', summary: 'S', dynamic_tags: [] }) } }],
    });
    await service.analyzeLink({ url: 'https://x.com', rawTextSample: '', contextText: '' });
    expect(mockCreate.mock.calls[0][0].model).toBe('gpt-4o-mini');
  });

  it('should include url in user content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'ARTICLE', intent: 'TO_READ', summary: 'S', dynamic_tags: [] }) } }],
    });
    await service.analyzeLink({ url: 'https://special.com', rawTextSample: '', contextText: '' });
    const userMsg = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMsg).toContain('https://special.com');
  });

  it('should return valid category values', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'VIDEO', intent: 'TO_READ', summary: 'Watch this', dynamic_tags: ['video'] }) } }],
    });
    const result = await service.analyzeLink({ url: 'https://youtube.com', rawTextSample: '', contextText: '' });
    expect(['ARTICLE', 'VIDEO', 'PRODUCT', 'DEV']).toContain(result.category);
  });

  it('should return valid intent values', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'PRODUCT', intent: 'TO_BUY', summary: 'Buy this', dynamic_tags: [] }) } }],
    });
    const result = await service.analyzeLink({ url: 'https://amazon.com', rawTextSample: '', contextText: '' });
    expect(['TO_READ', 'TO_BUY', 'CODE_REVIEW', 'GENERAL']).toContain(result.intent);
  });

  it('should handle empty rawTextSample without crashing', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: 'ARTICLE', intent: 'TO_READ', summary: 'S', dynamic_tags: [] }) } }],
    });
    const result = await service.analyzeLink({ url: 'https://x.com', rawTextSample: '', contextText: '' });
    expect(result).toBeDefined();
  });
});
