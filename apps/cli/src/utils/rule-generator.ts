import { access, appendFile, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { DetectedWorkflow } from './workflow-detector';

/** Marker used to avoid injecting our rule twice into append targets. */
const MARKER = 'Githancer — commit rule';

const CLAUDE_RULE = `# Githancer — commit rule

This project uses Githancer for Git timeline management.

CRITICAL: Never run \`git commit\` directly.
Always use \`timeline commit\` instead.

Workflow:
- Stage changes normally (git add)
- Run: timeline commit -m "your message"
- When ready to push: timeline push
- To check queue: timeline status
- If cache empty: timeline sync

The timeline CLI backdates commits to scheduled timestamps.
Direct git commits bypass the schedule and break the timeline.
`;

const CURSOR_RULE = `---
description: Githancer commit rules for this project
alwaysApply: true
---

# Githancer — commit rule

Never use \`git commit\` directly in this project.
Always use \`timeline commit -m "message"\` instead.

Commands:
- Commit: timeline commit -m "message"
- Push: timeline push
- Status: timeline status
- Refill cache: timeline sync
`;

const COPILOT_APPEND = `
## Githancer — commit rule

This project uses Githancer for Git timeline management.
Never suggest or run \`git commit\` directly.
Always use \`timeline commit -m "message"\` for commits
and \`timeline push\` to push.
`;

const COPILOT_NEW = `# GitHub Copilot Instructions
${COPILOT_APPEND}`;

const AGENTS_NEW = `# Githancer — commit rule

Never run git commit directly.
Use: timeline commit -m "message"
Push: timeline push
`;

const AGENTS_APPEND = `
## Githancer — commit rule
Never run git commit directly.
Use: timeline commit -m "message"
`;

const STANDALONE = `# Githancer — AI Agent Commit Rules

This project uses **Githancer** for Git timeline management. Commits are dated to
a schedule, so AI agents and contributors must commit through the \`timeline\` CLI
instead of \`git\` directly.

## The one rule

NEVER run \`git commit\` directly. ALWAYS use \`timeline commit\`.
Direct git commits bypass the schedule and break the timeline.

## Commands

- Stage: \`git add\` (as normal)
- Commit: \`timeline commit -m "your message"\`
- Push: \`timeline push\`
- Status: \`timeline status\`
- Refill cache (if empty): \`timeline sync\`

## Where to put these rules for your tool

- Claude Code → \`.claude/rules/githancer.md\`
- Cursor → \`.cursor/rules/githancer.mdc\` (frontmatter: \`alwaysApply: true\`)
- GitHub Copilot → append to \`.github/copilot-instructions.md\`
- Aider / other agents → keep this file as \`AGENTS.md\` or \`GITHANCER_AGENTS.md\`
`;

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Create a dedicated rule file, skipping if one already exists. */
async function writeIfAbsent(fullPath: string, content: string): Promise<void> {
  if (await pathExists(fullPath)) {
    return;
  }
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
}

/** Append a rule block to a file (create it if missing), unless already present. */
async function appendOrCreate(
  fullPath: string,
  appendBlock: string,
  createContent: string,
): Promise<void> {
  if (await pathExists(fullPath)) {
    const existing = await readFile(fullPath, 'utf8');
    if (existing.includes(MARKER)) {
      return;
    }
    await appendFile(fullPath, appendBlock, 'utf8');
    return;
  }
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, createContent, 'utf8');
}

/**
 * Write / append the appropriate rule for a tool. `standalone` always writes
 * GITHANCER_AGENTS.md. Returns the project-relative path that was created or
 * modified.
 */
export async function injectRule(
  tool: DetectedWorkflow,
  mode: 'inject' | 'standalone',
): Promise<string> {
  const cwd = process.cwd();

  if (mode === 'standalone') {
    await writeFile(join(cwd, 'GITHANCER_AGENTS.md'), STANDALONE, 'utf8');
    return 'GITHANCER_AGENTS.md';
  }

  switch (tool.tool) {
    case 'claude_code':
      await writeIfAbsent(join(cwd, '.claude', 'rules', 'githancer.md'), CLAUDE_RULE);
      return '.claude/rules/githancer.md';
    case 'cursor':
      await writeIfAbsent(join(cwd, '.cursor', 'rules', 'githancer.mdc'), CURSOR_RULE);
      return '.cursor/rules/githancer.mdc';
    case 'copilot':
      await appendOrCreate(
        join(cwd, '.github', 'copilot-instructions.md'),
        COPILOT_APPEND,
        COPILOT_NEW,
      );
      return '.github/copilot-instructions.md';
    case 'aider':
    case 'agents_md':
      await appendOrCreate(join(cwd, 'AGENTS.md'), AGENTS_APPEND, AGENTS_NEW);
      return 'AGENTS.md';
    default:
      throw new Error(`No rule template for tool: ${tool.tool}`);
  }
}
