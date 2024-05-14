import { z } from 'zod';

import { TaskEntitySchema } from './task.entity';

export const AnalyzeRepositoryTaskEntitySchema = TaskEntitySchema.extend({
  options: z
    .object({
      buildTool: z.string(),
      gitCloneUrl: z.string(),
      gitRef: z.string(),
      isSonarQubeEnabled: z.boolean(),
      repositoryName: z.string(),
      workdir: z.string(),
    })
    .strip(),
});
