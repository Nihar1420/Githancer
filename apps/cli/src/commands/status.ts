import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { ApiClient, CLIOfflineError } from '../api/api.client';
import { handleCliError } from './error';

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show commit queue progress')
    .action(async () => {
      const config = new ConfigService().read();
      const cache = new CacheService();
      const api = new ApiClient(config);
      try {
        let completed = 0;
        let remaining = cache.remaining();
        const next = cache.peekNext();

        try {
          const status = await api.getStatus(config.projectId);
          completed = status.completed;
          remaining = status.remaining;
        } catch (error) {
          if (!(error instanceof CLIOfflineError)) {
            throw error;
          }
          console.log(chalk.yellow('⚠ Offline — showing cached data.'));
        }

        const nextDisplay = next
          ? new Date(next).toLocaleString()
          : remaining === 0
            ? 'cache empty'
            : 'unknown';

        console.log(`${chalk.bold('Completed:')}  ${completed}`);
        console.log(`${chalk.bold('Remaining:')}  ${remaining}`);
        console.log(`${chalk.bold('Next:')}       ${nextDisplay}`);
      } catch (error) {
        handleCliError(error);
      }
    });
}
