import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import { existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigService } from '../config/config.service';
import {
  GITHANCER_API_URL,
  GITHANCER_DASHBOARD_URL,
  CLI_CALLBACK_PORT,
} from '../config/constants';
import { detectWorkflows } from '../utils/workflow-detector';
import { injectRule } from '../utils/rule-generator';
import { registerProtocolHandler } from '../utils/protocol-handler';

const CALLBACK_TIMEOUT_MS = 5 * 60_000; // 5 minutes

/** Credentials delivered by the browser (via local server or deep link). */
export interface IncomingCredentials {
  userId: string;
  apiKey: string;
  projectId: string;
  branch: string;
  repoFullName: string;
}

/** Parse credentials out of a callback URL's query string. Accepts `repo` as an alias for `repoFullName`. */
export function parseCredentials(params: URLSearchParams): IncomingCredentials {
  return {
    userId: params.get('userId') ?? '',
    apiKey: params.get('apiKey') ?? '',
    projectId: params.get('projectId') ?? '',
    branch: params.get('branch') ?? 'main',
    repoFullName: params.get('repoFullName') ?? params.get('repo') ?? '',
  };
}

const SUCCESS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Githancer</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:64px;background:#0f172a;color:#e2e8f0">
<h2 style="color:#818cf8">&#10003; Sent to the Githancer CLI</h2>
<p>You can close this tab and return to your terminal.</p>
</body></html>`;

/**
 * Listen on CLI_CALLBACK_PORT for a single `GET /callback?...` and resolve with
 * the parsed credentials. Both the browser's direct fetch and the githancer://
 * deep-link handler (which forwards here) converge on this one server, so the
 * first valid callback wins and the rest are ignored.
 */
function waitForCredentials(): {
  server: Server;
  ready: Promise<void>;
  credentials: Promise<IncomingCredentials>;
} {
  let resolveReady!: () => void;
  let rejectReady!: (err: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  let settled = false;
  let resolveCreds!: (creds: IncomingCredentials) => void;
  const credentials = new Promise<IncomingCredentials>((resolve) => {
    resolveCreds = resolve;
  });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://localhost:${CLI_CALLBACK_PORT}`);
    if (url.pathname !== '/callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const creds = parseCredentials(url.searchParams);
    if (!creds.userId || !creds.apiKey) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing userId or apiKey');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(SUCCESS_HTML);

    if (!settled) {
      settled = true;
      resolveCreds(creds);
    }
  });

  server.once('error', (err) => rejectReady(err));
  server.listen(CLI_CALLBACK_PORT, '127.0.0.1', () => resolveReady());

  return { server, ready, credentials };
}

/** Open a URL in the default browser. `open` is ESM-only, so import it dynamically. */
async function openBrowser(url: string): Promise<boolean> {
  // Preserve a real runtime dynamic import — a plain `import()` would be
  // down-compiled to `require()` under module:commonjs and break ESM `open`.
  const dynamicImport = new Function('m', 'return import(m)') as (
    m: string,
  ) => Promise<{ default: (target: string) => Promise<unknown> }>;
  try {
    const { default: open } = await dynamicImport('open');
    await open(url);
    return true;
  } catch {
    return false;
  }
}

/** Detect AI dev tools and inject Githancer rules silently (no prompts). */
async function injectAiRulesSilently(): Promise<string[]> {
  const injected: string[] = [];
  try {
    const detected = (await detectWorkflows()).filter((w) => w.detected);
    for (const tool of detected) {
      injected.push(await injectRule(tool, 'inject'));
    }
  } catch {
    // Rule injection is best-effort — never block setup on it.
  }
  return injected;
}

function ensureGitignore(): void {
  const gitignorePath = join(process.cwd(), '.gitignore');
  const entries = ['.timeline.json', '.timeline-cache.json'];
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf8');
    const missing = entries.filter((entry) => !content.includes(entry));
    if (missing.length > 0) {
      appendFileSync(gitignorePath, `\n${missing.join('\n')}\n`);
    }
  } else {
    appendFileSync(gitignorePath, `${entries.join('\n')}\n`);
  }
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Set up Githancer for this repository (opens browser)')
    .action(async () => {
      const configService = new ConfigService();

      // 1 — confirm before overwriting an existing config
      if (configService.exists()) {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = (await rl.question('Re-initialize? This will overwrite your config. (Y/n): '))
          .trim()
          .toLowerCase();
        rl.close();
        if (answer === 'n') {
          console.log('Cancelled — existing config kept.');
          return;
        }
      }

      // 5 (part) — register the deep-link handler so githancer:// forwards here (Linux/Windows)
      await registerProtocolHandler(process.argv[1]);

      // 4 — start the local callback server
      const { server, ready, credentials } = waitForCredentials();
      try {
        await ready;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EADDRINUSE') {
          console.error(
            chalk.red(
              `✗ Port ${CLI_CALLBACK_PORT} is already in use. Close whatever is using it and run "timeline init" again.`,
            ),
          );
        } else {
          console.error(chalk.red(`✗ Could not start local setup server: ${String(err)}`));
        }
        process.exitCode = 1;
        return;
      }

      // 2 & 3 — open the browser
      const dashboardUrl = `${GITHANCER_DASHBOARD_URL}/cli-setup?source=cli`;
      console.log(chalk.cyan('Opening Githancer in your browser...'));
      console.log('Select your project and click ' + chalk.bold('Send to CLI') + '.');
      const opened = await openBrowser(dashboardUrl);
      if (!opened) {
        console.log(chalk.yellow('⚠ Could not open the browser automatically. Open this URL:'));
        console.log('  ' + chalk.underline(dashboardUrl));
      }
      console.log('');

      // 5 — wait for whichever channel delivers credentials first, with a timeout
      const spinner = ora('Waiting for browser authorization... (Ctrl+C to cancel)').start();

      const onSigint = (): void => {
        spinner.stop();
        server.close();
        console.log(chalk.yellow('\nCancelled.'));
        process.exit(130);
      };
      process.on('SIGINT', onSigint);

      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), CALLBACK_TIMEOUT_MS);
      });

      const result = await Promise.race([credentials, timeout]);

      if (timer) clearTimeout(timer);
      process.off('SIGINT', onSigint);
      spinner.stop();

      // 6 (timeout branch) — bail out gracefully
      if (result === 'timeout') {
        server.close();
        console.log(chalk.yellow('⏱ Timed out waiting for browser authorization.'));
        console.log('Run timeline init again, or use manual setup at:');
        console.log('  ' + chalk.underline(`${GITHANCER_DASHBOARD_URL}/cli-setup`));
        process.exitCode = 1;
        return;
      }

      const creds = result;

      // 6 — write config
      configService.write({
        projectId: creds.projectId,
        userId: creds.userId,
        branch: creds.branch || 'main',
        apiUrl: GITHANCER_API_URL,
        apiKey: creds.apiKey,
        repoFullName: creds.repoFullName || undefined,
      });
      ensureGitignore();

      // 7 — inject AI workflow rules silently
      const injected = await injectAiRulesSilently();
      for (const path of injected) {
        console.log(chalk.green(`✓ Githancer rules added to ${path}`));
      }

      // 9 — stop the server
      server.close();

      // 8 — success summary
      const project = creds.repoFullName || creds.projectId || '(none)';
      console.log('');
      console.log(chalk.green('✓ Configured successfully!'));
      console.log('');
      console.log(`  Project:  ${project}`);
      console.log(`  Branch:   ${creds.branch || 'main'}`);
      console.log(`  User:     ${creds.userId}`);
      console.log('');
      console.log('Next steps:');
      console.log('  timeline sync     → cache timestamps');
      console.log('  timeline commit   → start committing');
    });
}
