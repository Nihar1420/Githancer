import { Command } from 'commander';
import { get } from 'http';
import chalk from 'chalk';
import { ConfigService, type TimelineConfig } from '../config/config.service';
import { GITHANCER_API_URL, CLI_CALLBACK_PORT } from '../config/constants';

/** Forward the callback query to a running `timeline init` server. Resolves true on 2xx. */
function forwardToInitServer(query: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = get(
      { host: '127.0.0.1', port: CLI_CALLBACK_PORT, path: `/callback?${query}`, timeout: 3000 },
      (res) => {
        res.resume(); // drain
        resolve((res.statusCode ?? 500) < 400);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

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

      const params = parsed.searchParams;
      const userId = params.get('userId') ?? '';
      const apiKey = params.get('apiKey') ?? '';
      if (!userId || !apiKey) {
        console.error(chalk.red('✗ Deep link is missing userId or apiKey.'));
        process.exitCode = 1;
        return;
      }

      // Preferred path: a `timeline init` server is waiting — hand off to it so
      // there's a single writer and consistent messaging.
      const forwarded = await forwardToInitServer(params.toString());
      if (forwarded) {
        console.log(chalk.green('✓ Handed credentials to the running "timeline init".'));
        console.log('  Return to that terminal to finish setup.');
        return;
      }

      // Legacy fallback: no init server running — write the config directly.
      const configService = new ConfigService();
      const branch = params.get('branch') ?? 'main';
      const repoFullName = params.get('repoFullName') ?? params.get('repo') ?? undefined;
      const projectId = params.get('projectId') ?? '';

      const config: TimelineConfig = {
        projectId,
        userId,
        branch,
        apiUrl: GITHANCER_API_URL,
        apiKey,
        repoFullName,
      };
      configService.write(config);

      console.log(chalk.green('✓ CLI configured successfully!'));
      console.log(`  User:    ${userId}`);
      console.log(`  Project: ${repoFullName || projectId || '(none)'}`);
      console.log('');
      console.log('Next steps:');
      console.log('  timeline sync     → cache timestamps');
      console.log('  timeline commit   → start committing');
    });
}
