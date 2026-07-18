import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUserId } from '../common/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get(':id')
  get(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.analytics.getFullAnalytics(userId, id);
  }
}
