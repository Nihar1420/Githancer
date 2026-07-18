import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI is not configured');
    this.name = 'AiNotConfiguredError';
  }
}

export interface CommitMessageContext {
  repoFullName: string;
  branch: string;
  recentMessages: string[];
  projectDescription?: string;
}

const MODEL = 'claude-3-5-haiku-latest';
const SYSTEM_PROMPT =
  'You are a helpful assistant that writes concise, conventional Git commit messages. ' +
  'Write only the commit message, nothing else. Use conventional commits format ' +
  '(feat/fix/chore/docs/refactor). Max 72 characters.';

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async suggestCommitMessage(context: CommitMessageContext): Promise<string> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new AiNotConfiguredError();
    }

    const client = new Anthropic({ apiKey });
    const userPrompt =
      `Repository: ${context.repoFullName}, Branch: ${context.branch}. ` +
      `Recent commits: ${context.recentMessages.join(', ')}.` +
      (context.projectDescription ? ` Project: ${context.projectDescription}.` : '') +
      ' Suggest one commit message for the next commit.';

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();
      return text.replace(/^["']|["']$/g, '').trim();
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        throw error;
      }
      throw new Error(
        `AI request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
