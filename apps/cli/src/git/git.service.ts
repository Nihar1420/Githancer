import simpleGit, { SimpleGit } from 'simple-git';

export class GitService {
  private readonly git: SimpleGit = simpleGit(process.cwd());

  async isGitRepo(): Promise<boolean> {
    return this.git.checkIsRepo();
  }

  async getCurrentBranch(): Promise<string> {
    return (await this.git.branch()).current;
  }

  async stageAll(): Promise<void> {
    await this.git.add('.');
  }

  /**
   * Commit with a backdated author + committer date so the commit lands on the
   * scheduled point in the timeline.
   */
  async commitWithDate(message: string, isoDate: string): Promise<string> {
    const env = {
      ...process.env,
      GIT_AUTHOR_DATE: isoDate,
      GIT_COMMITTER_DATE: isoDate,
    } as Record<string, string>;
    const result = await this.git.env(env).commit(message);
    return result.commit;
  }

  async push(branch: string): Promise<void> {
    await this.git.push('origin', branch);
  }

  async getLastCommitHash(): Promise<string> {
    return (await this.git.revparse(['HEAD'])).trim();
  }
}
