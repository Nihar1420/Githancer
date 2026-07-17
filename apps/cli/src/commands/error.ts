import chalk from 'chalk';
import { CLIAuthError, CLIOfflineError } from '../api/api.client';

/** Print a CLI error consistently and set a non-zero exit code. */
export function handleCliError(error: unknown): void {
  if (error instanceof CLIAuthError) {
    console.error(chalk.red(`✗ ${error.message}`));
  } else if (error instanceof CLIOfflineError) {
    console.error(chalk.yellow(`⚠ ${error.message}`));
  } else {
    console.error(chalk.red(`✗ ${error instanceof Error ? error.message : String(error)}`));
  }
  process.exitCode = 1;
}
