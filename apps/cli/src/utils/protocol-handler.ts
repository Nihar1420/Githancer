import { platform, homedir } from 'os';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface RegisterResult {
  ok: boolean;
  message: string;
}

/**
 * Register the githancer:// URL scheme so the "Send to CLI" deep link opens
 * `timeline handle-auth <url>`. Best-effort and never throws.
 *
 * Linux (.desktop + xdg-mime) and Windows (registry) work from a CLI. macOS URL
 * schemes require an .app bundle registered with Launch Services — a LaunchAgent
 * does NOT register a scheme (and would create a broken agent) — so macOS is a
 * clean skip in favor of the manual-setup fallback on the CLI Setup page.
 */
export async function registerProtocolHandler(cliEntryPath: string): Promise<RegisterResult> {
  try {
    switch (platform()) {
      case 'linux':
        return await registerLinux(cliEntryPath);
      case 'win32':
        return await registerWindows(cliEntryPath);
      case 'darwin':
        return {
          ok: false,
          message:
            'Automatic githancer:// registration is not supported on macOS from the CLI — use manual setup.',
        };
      default:
        return { ok: false, message: `Protocol registration not supported on ${platform()}.` };
    }
  } catch (error) {
    return {
      ok: false,
      message: `Could not register protocol handler: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function registerLinux(cliEntryPath: string): Promise<RegisterResult> {
  const appsDir = join(homedir(), '.local', 'share', 'applications');
  await mkdir(appsDir, { recursive: true });
  const desktopFile = join(appsDir, 'githancer-cli.desktop');
  const content = `[Desktop Entry]
Name=Githancer CLI
Exec=node ${cliEntryPath} handle-auth %u
Type=Application
Terminal=true
NoDisplay=true
MimeType=x-scheme-handler/githancer;
`;
  await writeFile(desktopFile, content, 'utf8');
  await execFileAsync('xdg-mime', [
    'default',
    'githancer-cli.desktop',
    'x-scheme-handler/githancer',
  ]);
  try {
    await execFileAsync('update-desktop-database', [appsDir]);
  } catch {
    // Optional cache refresh — safe to ignore if the tool is absent.
  }
  return { ok: true, message: 'Registered githancer:// protocol handler.' };
}

async function registerWindows(cliEntryPath: string): Promise<RegisterResult> {
  const command = `node "${cliEntryPath}" handle-auth "%1"`;
  await execFileAsync('reg', [
    'add',
    'HKCU\\Software\\Classes\\githancer',
    '/ve',
    '/d',
    'URL:Githancer CLI',
    '/f',
  ]);
  await execFileAsync('reg', [
    'add',
    'HKCU\\Software\\Classes\\githancer',
    '/v',
    'URL Protocol',
    '/d',
    '',
    '/f',
  ]);
  await execFileAsync('reg', [
    'add',
    'HKCU\\Software\\Classes\\githancer\\shell\\open\\command',
    '/ve',
    '/d',
    command,
    '/f',
  ]);
  return { ok: true, message: 'Registered githancer:// protocol handler.' };
}
