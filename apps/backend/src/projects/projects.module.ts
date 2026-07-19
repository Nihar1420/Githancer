import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { CommitQueue } from '../commit-queue/commit-queue.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { GithubModule } from '../github/github.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, CommitQueue]),
    GithubModule,
    UsersModule,
    // forwardRef: AuthModule imports ProjectsModule (getCliSetup) and this route
    // needs CliOrJwtAuthGuard from AuthModule — a mutual module import.
    forwardRef(() => AuthModule),
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
