import { SimpleGit, simpleGit } from 'simple-git';
import { z } from 'zod';

import { Git } from './interfaces/git';

const LocalGitLog = z
  .object({
    date: z.string().pipe(z.coerce.date()),
    hash: z.string(),
    message: z.string(),
  })
  .transform((v) => ({
    createdAt: v.date,
    hash: v.hash,
    message: v.message,
  }));

export class LocalGit implements Git {
  private git: SimpleGit;

  constructor(repositoryPath: string) {
    this.git = simpleGit({ baseDir: repositoryPath });
  }

  async getHistory() {
    const log = await this.git.log({ strictDate: true });
    this.git.log();
    return log.all.map((e) => LocalGitLog.parse(e));
  }

  async getLatestCommit() {
    const log = await this.git.log({
      maxCount: 1,
      strictDate: true,
    });
    return LocalGitLog.parse(log.latest);
  }
}
