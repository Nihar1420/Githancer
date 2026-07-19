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
import { CommitQueueService } from './commit-queue.service';
import { CommitStatus } from './commit-queue.entity';
import { UpdateCommitDto } from './dtos/update-commit.dto';
import { ReorderQueueDto } from './dtos/reorder-queue.dto';
import { CurrentUserId } from '../common/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CliOrJwtAuthGuard } from '../auth/guards/cli-auth.guard';

@Controller()
export class CommitQueueController {
  constructor(private readonly commitQueueService: CommitQueueService) {}

  // Accepts CLI Bearer key OR dashboard JWT cookie. @Public bypasses the global
  // JWT guard so the CLI path can run; CliOrJwtAuthGuard does the real check.
  @Public()
  @UseGuards(CliOrJwtAuthGuard)
  @Get('projects/:id/next-commit')
  nextCommit(@CurrentUserId() userId: string, @Param('id') projectId: string) {
    return this.commitQueueService.nextCommit(userId, projectId);
  }

  @Public()
  @UseGuards(CliOrJwtAuthGuard)
  @Patch('commit-queue/:id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommitDto,
  ) {
    const status =
      dto.status === 'executed' ? CommitStatus.EXECUTED : CommitStatus.SKIPPED;
    return this.commitQueueService.markExecuted(userId, id, status, dto.commitHash);
  }

  // Accepts CLI Bearer key OR dashboard JWT cookie — `timeline sync` reads the
  // queue over the CLI key, the dashboard reads it over the cookie.
  @Public()
  @UseGuards(CliOrJwtAuthGuard)
  @Get('projects/:id/queue')
  list(
    @CurrentUserId() userId: string,
    @Param('id') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commitQueueService.list(
      userId,
      projectId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Put('projects/:id/queue/reorder')
  reorder(
    @CurrentUserId() userId: string,
    @Param('id') projectId: string,
    @Body() dto: ReorderQueueDto,
  ) {
    return this.commitQueueService.reorder(userId, projectId, dto.order);
  }
}
