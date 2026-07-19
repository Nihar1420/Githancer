import simpleGit, { SimpleGit } from 'simple-git';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class GitService {
  private readonly git: SimpleGit = simpleGit(process.cwd());

  async isGitRepo(): Promise<boolean> {
    return this.git.checkIsRepo();
  }

  async getCurrentBranch(): Promise<string> {
    return (await this.git.branch()).current;
  }

  async stageAll(): Promise<void> {
    // Spawn git directly rather than via simple-git: simple-git refuses to run
    // when GIT_ASKPASS is present in the env (VS Code sets it) unless
    // allowUnsafeAskPass is enabled. A local `git add` never needs askpass.
    await execFileAsync('git', ['add', '-A'], { cwd: process.cwd() });
  }

  /**
   * Commit with a backdated author + committer date so the commit lands on the
   * scheduled point in the timeline.
   *
   * Spawns git directly (child_process) instead of simple-git's
   * `.env(...).commit()` — passing the inherited env (which includes VS Code's
   * GIT_ASKPASS) through simple-git triggers its "Use of GIT_ASKPASS is not
   * permitted without enabling allowUnsafeAskPass" guard. A local commit never
   * invokes askpass, so spawning git ourselves is both safe and correct.
   * Staging is done separately by stageAll().
   */
  async commitWithDate(message: string, isoDate: string): Promise<string> {
    await execFileAsync('git', ['commit', '-m', message], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: isoDate,
        GIT_COMMITTER_DATE: isoDate,
      },
    });
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(),
    });
    return stdout.trim();
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
