import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CommitQueueService } from './commit-queue.service';
import { CommitStatus } from './commit-queue.entity';
import { UpdateCommitDto } from './dtos/update-commit.dto';
import { ReorderQueueDto } from './dtos/reorder-queue.dto';

@Controller()
export class CommitQueueController {
  constructor(private readonly commitQueueService: CommitQueueService) {}

  // TODO(Phase 3): throttle per-project rather than per-IP via a custom tracker.
  @Get('projects/:id/next-commit')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  nextCommit(@Param('id') projectId: string) {
    return this.commitQueueService.nextCommit(projectId);
  }

  @Patch('commit-queue/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCommitDto) {
    const status =
      dto.status === 'executed' ? CommitStatus.EXECUTED : CommitStatus.SKIPPED;
    return this.commitQueueService.markExecuted(id, status, dto.commitHash);
  }

  @Get('projects/:id/queue')
  list(
    @Param('id') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commitQueueService.list(
      projectId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Put('projects/:id/queue/reorder')
  reorder(@Param('id') projectId: string, @Body() dto: ReorderQueueDto) {
    return this.commitQueueService.reorder(projectId, dto.order);
  }
}
