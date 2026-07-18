import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService, AiNotConfiguredError } from './ai.service';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}));

describe('AiService', () => {
  let service: AiService;
  const config = { get: jest.fn() };
  const context = { repoFullName: 'nihar/app', branch: 'main', recentMessages: [] as string[] };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [AiService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = moduleRef.get(AiService);
  });

  it('returns the suggestion text from the API response', async () => {
    config.get.mockReturnValue('sk-test');
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'feat: add login flow' }] });
    expect(await service.suggestCommitMessage(context)).toBe('feat: add login flow');
  });

  it('strips surrounding quotes from the suggestion', async () => {
    config.get.mockReturnValue('sk-test');
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: '"fix: null guard"' }] });
    expect(await service.suggestCommitMessage(context)).toBe('fix: null guard');
  });

  it('throws AiNotConfiguredError when the API key is missing', async () => {
    config.get.mockReturnValue(undefined);
    await expect(service.suggestCommitMessage(context)).rejects.toBeInstanceOf(AiNotConfiguredError);
  });

  it('throws a descriptive error when the API call fails', async () => {
    config.get.mockReturnValue('sk-test');
    mockCreate.mockRejectedValue(new Error('rate limited'));
    await expect(service.suggestCommitMessage(context)).rejects.toThrow(/AI request failed/);
  });
});
