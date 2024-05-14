import { z } from 'zod';

export const RepositoryEntitySchema = z
  .object({
    repositoryName: z.string().min(1),
    gitCloneUrl: z.string().min(1),
    defaults: z
      .object({
        buildTool: z.string().default('none'),
        javaVersion: z.string().default('none'),
        isSonarQubeEnabled: z.boolean().default(false),
        pythonVersion: z.string().default('none'),
        workdir: z.string().default('.'),
      })
      .strip(),
  })
  .strip();
