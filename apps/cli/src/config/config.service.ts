import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface TimelineConfig {
  projectId: string;
  userId: string;
  branch: string;
  apiUrl: string;
  apiKey: string;
}

const CONFIG_FILE = '.timeline.json';

export class ConfigService {
  private readonly path = join(process.cwd(), CONFIG_FILE);

  exists(): boolean {
    return existsSync(this.path);
  }

  read(): TimelineConfig {
    if (!this.exists()) {
      throw new Error(`${CONFIG_FILE} not found. Run "timeline init" first.`);
    }
    return JSON.parse(readFileSync(this.path, 'utf8')) as TimelineConfig;
  }

  write(config: TimelineConfig): void {
    writeFileSync(this.path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
}
