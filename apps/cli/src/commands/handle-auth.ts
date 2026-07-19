import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import chalk from 'chalk';
import { ConfigService, type TimelineConfig } from '../config/config.service';

export function registerHandleAuth(program: Command): void {
  program
    .command('handle-auth <url>', { hidden: true })
    .description('Internal: configure the CLI from a githancer:// deep link')
    .action(async (url: string) => {
      let parsed: URL;
      try {
        parsed = new URL(url.replace('githancer://', 'https://githancer/'));
      } catch {
        console.error(chalk.red('✗ Invalid githancer:// URL.'));
        process.exitCode = 1;
        return;
      }

      const userId = parsed.searchParams.get('userId') ?? '';
      const apiKey = parsed.searchParams.get('apiKey') ?? '';
      const projectId = parsed.searchParams.get('projectId') ?? '';
      const apiUrl = parsed.searchParams.get('apiUrl') ?? 'https://api.githancer.com';

      if (!userId || !apiKey) {
        console.error(chalk.red('✗ Deep link is missing userId or apiKey.'));
        process.exitCode = 1;
        return;
      }

      const configService = new ConfigService();
      let branch = 'main';
      let resolvedProjectId = projectId;

      if (configService.exists()) {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = (await rl.question('Update existing config? (Y/n): ')).trim().toLowerCase();
        rl.close();
        if (answer === 'n') {
          console.log('Cancelled — existing config kept.');
          return;
        }
        const existing = configService.read();
        branch = existing.branch || 'main';
        if (!resolvedProjectId) {
          resolvedProjectId = existing.projectId;
        }
      }

      const config: TimelineConfig = {
        projectId: resolvedProjectId,
        userId,
        branch,
        apiUrl,
        apiKey,
      };
      configService.write(config);

      console.log(chalk.green('✓ CLI configured successfully!'));
      console.log(`  User:    ${userId}`);
      console.log(`  Project: ${resolvedProjectId || '(none)'}`);
      console.log(`  API URL: ${apiUrl}`);
      console.log('');
      console.log('Next steps:');
      console.log('  timeline sync     → cache timestamps');
      console.log('  timeline commit   → start committing');
    });
}
