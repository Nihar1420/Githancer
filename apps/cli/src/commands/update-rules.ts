import { Command } from 'commander';
import chalk from 'chalk';
import { detectWorkflows } from '../utils/workflow-detector';
import { refreshRule, refreshStandalone } from '../utils/rule-generator';
import { handleCliError } from './error';

export function registerUpdateRules(program: Command): void {
  program
    .command('update-rules')
    .alias('rules')
    .description('Update AI tool rule files to latest version')
    .action(async () => {
      try {
        const workflows = await detectWorkflows();
        const updated: string[] = [];

        for (const workflow of workflows) {
          if (workflow.tool === 'none') continue;
          const path = await refreshRule(workflow);
          if (path && !updated.includes(path)) {
            updated.push(path);
          }
        }

        const standalone = await refreshStandalone();
        if (standalone) {
          updated.push(standalone);
        }

        if (updated.length === 0) {
          console.log(
            chalk.yellow(
              'No Githancer rule files found. Run "timeline init" to set them up.',
            ),
          );
          return;
        }

        for (const path of updated) {
          console.log(chalk.green(`✓ Updated ${path}`));
        }
      } catch (error) {
        handleCliError(error);
      }
    });
}
