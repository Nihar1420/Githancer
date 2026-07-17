import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import { existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';

const DEFAULT_API_URL = 'https://api.githancer.com';

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Create .timeline.json and configure this project')
    .action(async () => {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const apiUrl =
          (await rl.question(`API URL (${DEFAULT_API_URL}): `)).trim() || DEFAULT_API_URL;
        const projectId = (await rl.question('Project ID (required): ')).trim();
        if (!projectId) {
          console.error(chalk.red('✗ Project ID is required.'));
          process.exitCode = 1;
          return;
        }
        const branch = (await rl.question('Branch (main): ')).trim() || 'main';

        new ConfigService().write({ projectId, userId: '', branch, apiUrl, apiKey: '' });

        const gitignorePath = join(process.cwd(), '.gitignore');
        if (existsSync(gitignorePath)) {
          const content = readFileSync(gitignorePath, 'utf8');
          const missing = ['.timeline.json', '.timeline-cache.json'].filter(
            (entry) => !content.includes(entry),
          );
          if (missing.length > 0) {
            appendFileSync(gitignorePath, `\n${missing.join('\n')}\n`);
          }
        }

        console.log(chalk.green('✓ Initialized. Run "timeline login" to authenticate.'));
      } finally {
        rl.close();
      }
    });
}
