#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { registerInit } from './commands/init';
import { registerLogin } from './commands/login';
import { registerSync } from './commands/sync';
import { registerCommit } from './commands/commit';
import { registerPush } from './commands/push';
import { registerStatus } from './commands/status';
import { registerHandleAuth } from './commands/handle-auth';
import { registerUpdateRules } from './commands/update-rules';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as { version: string };

const program = new Command();
program
  .name('timeline')
  .description('Git Timeline Manager CLI — schedule and backdate commits')
  .version(pkg.version);

registerInit(program);
registerLogin(program);
registerSync(program);
registerCommit(program);
registerPush(program);
registerStatus(program);
registerHandleAuth(program);
registerUpdateRules(program);

program.parse(process.argv);

if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
