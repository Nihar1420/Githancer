import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitQueue } from './commit-queue.entity';
import { Project } from '../projects/project.entity';
import { CommitQueueService } from './commit-queue.service';
import { CommitQueueController } from './commit-queue.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommitQueue, Project]), AuthModule],
  providers: [CommitQueueService],
  controllers: [CommitQueueController],
  exports: [CommitQueueService],
})
export class CommitQueueModule {}
