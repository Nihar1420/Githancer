import { Injectable } from '@nestjs/common';

export interface RepoSummary {
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  pushedAt: string | null;
}

@Injectable()
export class GithubService {
  /**
   * @octokit/rest is ESM-only (v22). Load it via dynamic import so this
   * CommonJS backend can consume it.
   */
  private async createClient(accessToken: string) {
    const { Octokit } = await import('@octokit/rest');
    return new Octokit({ auth: accessToken });
  }

  async listUserRepos(accessToken: string): Promise<RepoSummary[]> {
    const octokit = await this.createClient(accessToken);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'pushed',
    });
    return data.map((repo) => ({
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      pushedAt: repo.pushed_at ?? null,
    }));
  }

  async listBranches(accessToken: string, owner: string, repo: string): Promise<string[]> {
    const octokit = await this.createClient(accessToken);
    const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
    return data.map((branch) => branch.name);
  }

  async validateBranch(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<boolean> {
    const octokit = await this.createClient(accessToken);
    try {
      await octokit.rest.repos.getBranch({ owner, repo, branch });
      return true;
    } catch {
      return false;
    }
  }
}
