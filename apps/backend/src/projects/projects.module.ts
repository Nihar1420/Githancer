import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { CommitQueue } from '../commit-queue/commit-queue.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { GithubModule } from '../github/github.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, CommitQueue]), GithubModule, UsersModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
