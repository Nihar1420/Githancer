import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';
import { GitService } from '../git/git.service';
import { handleCliError } from './error';

export function registerPush(program: Command): void {
  program
    .command('push')
    .description('Push the configured branch to origin')
    .action(async () => {
      const config = new ConfigService().read();
      const git = new GitService();
      try {
        await git.push(config.branch);
        console.log(chalk.green(`✓ Pushed to ${config.branch}`));
      } catch (error) {
        handleCliError(error);
      }
    });
}
