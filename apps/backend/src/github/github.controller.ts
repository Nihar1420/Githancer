import { Controller, Get, Param } from '@nestjs/common';
import { GithubService, RepoSummary } from './github.service';
import { UsersService } from '../users/users.service';
import { CurrentUserId } from '../common/current-user.decorator';

@Controller('github')
export class GithubController {
  constructor(
    private readonly github: GithubService,
    private readonly users: UsersService,
  ) {}

  @Get('repos')
  async listRepos(@CurrentUserId() userId: string): Promise<RepoSummary[]> {
    const token = await this.users.getDecryptedToken(userId);
    return this.github.listUserRepos(token);
  }

  @Get('repos/:owner/:repo/branches')
  async listBranches(
    @CurrentUserId() userId: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<string[]> {
    const token = await this.users.getDecryptedToken(userId);
    return this.github.listBranches(token, owner, repo);
  }
}
