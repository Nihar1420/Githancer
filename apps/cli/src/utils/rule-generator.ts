import { access, appendFile, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { DetectedWorkflow } from './workflow-detector';

/** Marker used to avoid injecting our rule twice into append targets. */
const MARKER = 'Githancer — commit rule';

const CLAUDE_RULE = `# Githancer — commit rule

This project uses Githancer to manage commit timestamps.

## Rule

Never run \`git commit\` directly.
Always use \`timeline commit\` instead.

This keeps commits consistent with the project's scheduled queue.
Direct git commits bypass the queue and create timestamp inconsistencies.

## Commands

- Commit:       timeline commit -m "your message"
- Push:         timeline push
- Queue status: timeline status
- Refill cache: timeline sync
`;

const CURSOR_RULE = `---
description: Githancer commit rule
alwaysApply: true
---

# Githancer — commit rule

This project uses Githancer to manage commit timestamps.
Never use git commit directly.
Always use: timeline commit -m "your message"
Push with:  timeline push
`;

const COPILOT_APPEND = `
## Githancer — commit rule

This project uses Githancer to manage commit timestamps.
Never suggest git commit directly.
Always use: timeline commit -m "message"
Push with:  timeline push
`;

const COPILOT_NEW = `# GitHub Copilot Instructions
${COPILOT_APPEND}`;

const AGENTS_NEW = `# Githancer — commit rule

This project uses Githancer to manage commit timestamps.

Never run git commit directly.
Always use: timeline commit -m "your message"
Push with:  timeline push
`;

const AGENTS_APPEND = `
## Githancer — commit rule

This project uses Githancer to manage commit timestamps.
Never run git commit directly.
Always use: timeline commit -m "your message"
Push with:  timeline push
`;

const STANDALONE = `# Githancer — commit rule

This project uses Githancer to manage commit timestamps.

## Rule

Never run \`git commit\` directly.
Always use \`timeline commit\` instead.

Commits are stamped with the next timestamp from the project's scheduled
queue. Direct git commits bypass the queue and create timestamp
inconsistencies.

## Commands

- Commit:       timeline commit -m "your message"
- Push:         timeline push
- Queue status: timeline status
- Refill cache: timeline sync

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
 * Replace the existing Githancer block in a shared file with the latest one.
 * The block starts at the `## Githancer — commit rule` heading and runs until
 * the next `## ` heading or EOF. If the file has no block, append it instead.
 */
async function replaceBlock(fullPath: string, appendBlock: string): Promise<void> {
  const existing = await readFile(fullPath, 'utf8');
  const headingRe = /^##\s+Githancer — commit rule\s*$/m;
  const start = existing.search(headingRe);
  if (start === -1) {
    await appendFile(fullPath, appendBlock, 'utf8');
    return;
  }
  const rest = existing.slice(start);
  const nextHeading = rest.slice(1).search(/^##\s+/m);
  const end = nextHeading === -1 ? existing.length : start + 1 + nextHeading;
  const updated =
    existing.slice(0, start).replace(/\n+$/, '\n') +
    appendBlock.replace(/^\n/, '') +
    existing.slice(end);
  await writeFile(fullPath, updated, 'utf8');
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

/**
 * Refresh an existing rule file for a tool with the latest content.
 * Dedicated files are overwritten; shared files (Copilot, AGENTS.md) have
 * only their Githancer block replaced. Returns the project-relative path
 * that was updated, or null if the tool has no rule file yet.
 */
export async function refreshRule(tool: DetectedWorkflow): Promise<string | null> {
  const cwd = process.cwd();

  switch (tool.tool) {
    case 'claude_code': {
      const p = join(cwd, '.claude', 'rules', 'githancer.md');
      if (!(await pathExists(p))) return null;
      await writeFile(p, CLAUDE_RULE, 'utf8');
      return '.claude/rules/githancer.md';
    }
    case 'cursor': {
      const p = join(cwd, '.cursor', 'rules', 'githancer.mdc');
      if (!(await pathExists(p))) return null;
      await writeFile(p, CURSOR_RULE, 'utf8');
      return '.cursor/rules/githancer.mdc';
    }
    case 'copilot': {
      const p = join(cwd, '.github', 'copilot-instructions.md');
      if (!(await pathExists(p))) return null;
      const existing = await readFile(p, 'utf8');
      if (!existing.includes(MARKER)) return null;
      await replaceBlock(p, COPILOT_APPEND);
      return '.github/copilot-instructions.md';
    }
    case 'aider':
    case 'agents_md': {
      const p = join(cwd, 'AGENTS.md');
      if (!(await pathExists(p))) return null;
      const existing = await readFile(p, 'utf8');
      if (!existing.includes(MARKER)) return null;
      // A pure-Githancer AGENTS.md (created by us) is overwritten whole;
      // otherwise only the Githancer block is replaced.
      if (existing.trimStart().startsWith('# Githancer')) {
        await writeFile(p, AGENTS_NEW, 'utf8');
      } else {
        await replaceBlock(p, AGENTS_APPEND);
      }
      return 'AGENTS.md';
    }
    default:
      return null;
  }
}

/**
 * Refresh a standalone GITHANCER_AGENTS.md if present. Returns the path or
 * null when the file doesn't exist.
 */
export async function refreshStandalone(): Promise<string | null> {
  const p = join(process.cwd(), 'GITHANCER_AGENTS.md');
  if (!(await pathExists(p))) return null;
  await writeFile(p, STANDALONE, 'utf8');
  return 'GITHANCER_AGENTS.md';
}
