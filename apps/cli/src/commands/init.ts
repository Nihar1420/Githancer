import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import { existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { ConfigService } from '../config/config.service';
import {
  detectWorkflows,
  workflowFor,
  type DetectedWorkflow,
  type WorkflowTool,
} from '../utils/workflow-detector';
import { injectRule } from '../utils/rule-generator';

const DEFAULT_API_URL = 'https://api.githancer.com';

const MANUAL_CHOICES: Record<string, Exclude<WorkflowTool, 'none' | 'agents_md'>> = {
  '1': 'claude_code',
  '2': 'cursor',
  '3': 'copilot',
  '4': 'aider',
};

/** Ask about AI tooling and write the matching rule file(s). Returns paths touched. */
async function configureAiRules(
  rl: ReturnType<typeof createInterface>,
): Promise<string[]> {
  const injected: string[] = [];
  const detected = (await detectWorkflows()).filter((w) => w.detected);

  if (detected.length > 0) {
    console.log(chalk.cyan(`✓ Detected AI dev tools: ${detected.map((d) => d.label).join(', ')}`));
    const choice = (
      await rl.question(
        'Configure Githancer rules for your AI tools? [Y] inject / [N] standalone file / [S] skip: ',
      )
    )
      .trim()
      .toLowerCase();

    if (choice === '' || choice === 'y') {
      for (const tool of detected) {
        injected.push(await injectRule(tool, 'inject'));
      }
    } else if (choice === 'n') {
      injected.push(await injectRule(detected[0], 'standalone'));
    }
    // 's' / anything else → skip
    return injected;
  }

  const answer = (
    await rl.question(
      'Do you use an AI-assisted development workflow?\n' +
        '  [1] Claude Code   [2] Cursor   [3] GitHub Copilot\n' +
        '  [4] Aider         [5] Other (standalone file)   [6] No (skip)\n> ',
    )
  ).trim();

  if (answer === '5') {
    injected.push(await injectRule(workflowFor('agents_md'), 'standalone'));
  } else if (MANUAL_CHOICES[answer]) {
    const tool: DetectedWorkflow = workflowFor(MANUAL_CHOICES[answer]);
    injected.push(await injectRule(tool, 'inject'));
  }
  // '6' / anything else → skip
  return injected;
}

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

        // Only the CLI's own files are gitignored — rule files are committed so
        // teammates get them too.
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

        const injected = await configureAiRules(rl);
        for (const path of injected) {
          console.log(chalk.green(`✓ Rule injected → ${path}`));
        }

        // Summary
        console.log('');
        console.log(chalk.green('✓ .timeline.json created'));
        console.log(chalk.green('✓ .gitignore updated'));
        for (const path of injected) {
          console.log(chalk.green(`✓ Rule file → ${path}`));
        }
        console.log('');
        console.log('Next steps:');
        console.log('  timeline login    → authenticate');
        console.log('  timeline sync     → cache timestamps');
        console.log('  timeline commit   → use instead of git commit');
      } finally {
        rl.close();
      }
    });
}
