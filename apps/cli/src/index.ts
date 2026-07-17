#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('timeline')
  .description('Git Timeline Manager CLI — schedule and backdate commits')
  .version('1.0.0');

// Commands are registered in Phase 3:
//   timeline init | login | sync | commit | push | status

program.parse(process.argv);

if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
