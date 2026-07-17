import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { ApiClient, CLIOfflineError } from '../api/api.client';
import { GitService } from '../git/git.service';
import { handleCliError } from './error';

export function registerCommit(program: Command): void {
  program
    .command('commit')
    .description('Create a backdated commit using the next scheduled timestamp')
    .option('-m, --message <message>', 'commit message')
    .action(async (options: { message?: string }) => {
      const config = new ConfigService().read();
      const git = new GitService();
      const cache = new CacheService();
      const api = new ApiClient(config);
      try {
        if (!(await git.isGitRepo())) {
          console.error(chalk.red('✗ Not a git repository.'));
          process.exitCode = 1;
          return;
        }
        if (!cache.hasTimestamps()) {
          console.error(chalk.red('✗ No cached timestamps. Run "timeline sync" first.'));
          process.exitCode = 1;
          return;
        }

        let message = options.message;
        if (!message) {
          const rl = createInterface({ input: process.stdin, output: process.stdout });
          message = (await rl.question('Commit message: ')).trim();
          rl.close();
        }
        if (!message) {
          console.error(chalk.red('✗ Commit message is required.'));
          process.exitCode = 1;
          return;
        }

        // Prefer the server's next entry (gives us the queue id to mark executed).
        // Offline, fall back to the cached timestamp.
        let timestamp = cache.peekNext() as string;
        let entryId: string | null = null;
        try {
          const next = await api.getNextCommit(config.projectId);
          timestamp = new Date(next.scheduledAt).toISOString();
          entryId = next.id;
        } catch (error) {
          if (!(error instanceof CLIOfflineError)) {
            throw error;
          }
        }

        await git.stageAll();
        const hash = await git.commitWithDate(message, timestamp);
        cache.popNext();

        if (entryId) {
          try {
            await api.markExecuted(entryId, hash);
          } catch (error) {
            if (error instanceof CLIOfflineError) {
              console.log(chalk.yellow('⚠ Offline — will reconcile on next sync.'));
            } else {
              throw error;
            }
          }
        } else {
          console.log(chalk.yellow('⚠ Offline — commit recorded locally, will reconcile on next sync.'));
        }

        console.log(
          chalk.green(`✓ Committed ${hash.slice(0, 7)} as of ${new Date(timestamp).toLocaleString()}`),
        );
      } catch (error) {
        handleCliError(error);
      }
    });
}
