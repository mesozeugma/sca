import { GitLog } from './git-log';

export interface Git {
  getHistory(): Promise<GitLog[]>;
}
