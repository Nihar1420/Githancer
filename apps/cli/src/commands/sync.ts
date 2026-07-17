import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { ApiClient } from '../api/api.client';
import { handleCliError } from './error';

const LOW_WATERMARK = 5;

export function registerSync(program: Command): void {
  program
    .command('sync')
    .description('Fetch and cache upcoming commit timestamps')
    .action(async () => {
      const config = new ConfigService().read();
      const cache = new CacheService();
      const api = new ApiClient(config);
      const spinner = ora('Syncing timestamps…').start();
      try {
        const timestamps = await api.syncTimestamps(config.projectId);
        cache.merge(timestamps);
        spinner.stop();
        const remaining = cache.remaining();
        const next = cache.peekNext();
        if (remaining < LOW_WATERMARK) {
          console.log(
            chalk.yellow(`⚠ Only ${remaining} timestamps remain — consider re-syncing soon.`),
          );
        }
        console.log(
          chalk.green(`✓ Synced ${timestamps.length} timestamps. Next: ${next ?? 'none'}`),
        );
      } catch (error) {
        spinner.stop();
        handleCliError(error);
      }
    });
}
