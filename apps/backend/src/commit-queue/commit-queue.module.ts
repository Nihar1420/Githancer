import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitQueue } from './commit-queue.entity';
import { CommitQueueService } from './commit-queue.service';
import { CommitQueueController } from './commit-queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommitQueue])],
  providers: [CommitQueueService],
  controllers: [CommitQueueController],
  exports: [CommitQueueService],
})
export class CommitQueueModule {}
