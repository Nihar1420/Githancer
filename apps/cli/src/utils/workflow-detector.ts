import { access } from 'fs/promises';
import { join } from 'path';

export type WorkflowTool =
  | 'claude_code'
  | 'cursor'
  | 'copilot'
  | 'aider'
  | 'agents_md'
  | 'none';

export interface DetectedWorkflow {
  tool: WorkflowTool;
  label: string;
  configPath: string;
  detected: boolean;
}

const META: Record<Exclude<WorkflowTool, 'none'>, { label: string; configPath: string }> = {
  claude_code: { label: 'Claude Code', configPath: '.claude/rules/githancer.md' },
  cursor: { label: 'Cursor', configPath: '.cursor/rules/githancer.mdc' },
  copilot: { label: 'GitHub Copilot', configPath: '.github/copilot-instructions.md' },
  aider: { label: 'Aider', configPath: 'AGENTS.md' },
  agents_md: { label: 'AGENTS.md', configPath: 'AGENTS.md' },
};

/** Build a DetectedWorkflow descriptor for a known tool. */
export function workflowFor(tool: Exclude<WorkflowTool, 'none'>): DetectedWorkflow {
  return { tool, label: META[tool].label, configPath: META[tool].configPath, detected: true };
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan the current working directory for AI dev-tool signatures.
 * Returns every tool detected, or a single { tool: 'none' } entry.
 */
export async function detectWorkflows(): Promise<DetectedWorkflow[]> {
  const cwd = process.cwd();
  const found: DetectedWorkflow[] = [];

  if (await pathExists(join(cwd, '.claude'))) {
    found.push(workflowFor('claude_code'));
  }
  if (await pathExists(join(cwd, '.cursor'))) {
    found.push(workflowFor('cursor'));
  }
  if (await pathExists(join(cwd, '.github', 'copilot-instructions.md'))) {
    found.push(workflowFor('copilot'));
  }
  if ((await pathExists(join(cwd, '.aider.conf.yml'))) || (await pathExists(join(cwd, '.aider')))) {
    found.push(workflowFor('aider'));
  }
  if (await pathExists(join(cwd, 'AGENTS.md'))) {
    found.push(workflowFor('agents_md'));
  }

  if (found.length === 0) {
    return [{ tool: 'none', label: 'None', configPath: '', detected: false }];
  }
  return found;
}
