import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService, AiNotConfiguredError } from './ai.service';
import { SuggestCommitDto } from './dtos/suggest-commit.dto';
import { CurrentUserId } from '../common/current-user.decorator';

@Controller('ai')
export class AiController {
  private readonly rateLog = new Map<string, number[]>();
  private readonly LIMIT = 5;
  private readonly WINDOW_MS = 60_000;

  constructor(private readonly ai: AiService) {}

  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const recent = (this.rateLog.get(userId) ?? []).filter((t) => now - t < this.WINDOW_MS);
    if (recent.length >= this.LIMIT) {
      const retryAfter = Math.ceil((this.WINDOW_MS - (now - recent[0])) / 1000);
      throw new HttpException(
        { message: 'Rate limit exceeded', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.rateLog.set(userId, recent);
  }

  @Post('suggest-commit')
  async suggest(
    @CurrentUserId() userId: string,
    @Body() dto: SuggestCommitDto,
  ): Promise<{ suggestion: string }> {
    this.enforceRateLimit(userId);
    try {
      const suggestion = await this.ai.suggestCommitMessage(dto);
      return { suggestion };
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        throw new ServiceUnavailableException(
          'AI commit suggestions not configured — set ANTHROPIC_API_KEY to enable',
        );
      }
      throw error;
    }
  }
}
