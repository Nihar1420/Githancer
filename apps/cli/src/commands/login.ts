import { Command } from 'commander';
import chalk from 'chalk';

/**
 * `timeline login` is deprecated — `timeline init` now handles the entire
 * browser-based setup in one step. The command stays registered (hidden) so
 * existing scripts/docs don't hard-error; it just points users at init.
 */
export function registerLogin(program: Command): void {
  program
    .command('login', { hidden: true })
    .description('Deprecated — use "timeline init"')
    .action(() => {
      console.log(chalk.yellow('timeline login is no longer needed.'));
      console.log('Run ' + chalk.bold('timeline init') + ' to set up the CLI via your browser.');
      process.exit(0);
    });
}
