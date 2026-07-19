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
    // NOTE: `type` is mutually exclusive with `visibility`/`affiliation` on this
    // endpoint (GitHub returns 422 if combined). Use visibility + affiliation to
    // get the user's OWN repos including private ones.
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      affiliation: 'owner',
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

  private static errorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;
      return typeof status === 'number' ? status : undefined;
    }
    return undefined;
  }

  async validateBranch(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<boolean> {
    console.log(`[github] validating branch ${owner}/${repo}#${branch}`);
    const octokit = await this.createClient(accessToken);
    try {
      await octokit.rest.repos.getBranch({ owner, repo, branch });
      return true;
    } catch (error) {
      const status = GithubService.errorStatus(error);
      if (status === 404) {
        return false; // repo or branch not found, or the token can't see it
      }
      if (status === 401 || status === 403) {
        throw new Error(
          `GitHub auth failed (${status}) validating ${owner}/${repo} — token may lack 'repo' scope`,
        );
      }
      console.warn(
        `[github] branch validation error for ${owner}/${repo}#${branch}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
