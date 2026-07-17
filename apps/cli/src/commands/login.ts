import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import axios from 'axios';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';

export function registerLogin(program: Command): void {
  program
    .command('login')
    .description('Authenticate the CLI and store the API key')
    .action(async () => {
      const configService = new ConfigService();
      const config = configService.read();
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const userId =
          (await rl.question(`User ID (${config.userId || 'required'}): `)).trim() ||
          config.userId;
        if (!userId) {
          console.error(chalk.red('✗ User ID is required.'));
          process.exitCode = 1;
          return;
        }

        // Try to mint a token via the API (needs a dashboard session). If that
        // is unavailable, fall back to pasting a key generated in the dashboard.
        // (Full OAuth device flow is planned for a later phase.)
        let apiKey = '';
        try {
          const { data } = await axios.post<{ apiKey: string }>(
            `${config.apiUrl}/api/v1/auth/cli-token`,
            {},
            { headers: { 'X-User-Id': userId }, timeout: 10_000 },
          );
          apiKey = data.apiKey;
        } catch {
          apiKey = (await rl.question('Paste CLI API key from the dashboard: ')).trim();
        }

        if (!apiKey) {
          console.error(chalk.red('✗ No API key provided.'));
          process.exitCode = 1;
          return;
        }

        configService.write({ ...config, userId, apiKey });
        console.log(chalk.green('✓ Authenticated. Run "timeline sync" to cache timestamps.'));
      } finally {
        rl.close();
      }
    });
}
