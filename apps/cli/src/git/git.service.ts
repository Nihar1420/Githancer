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

  /** Last N commit messages (subject line only), newest first. */
  async getRecentMessages(n: number): Promise<string[]> {
    try {
      const log = await this.git.log({ maxCount: n });
      return log.all.map((entry) => entry.message);
    } catch {
      return [];
    }
  }

  /** Best-effort "owner/repo" from the origin remote URL, or null. */
  async getRepoFullName(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      const url = origin?.refs?.fetch;
      if (!url) return null;
      const match = url.match(/[/:]([^/:]+\/[^/]+?)(?:\.git)?$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
