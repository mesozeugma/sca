import { z } from 'zod';

import { TaskEntitySchema } from './task.entity';

export const AnalyzeCommitsTaskEntitySchema = TaskEntitySchema.extend({
  options: z
    .object({
      gitBranch: z.string().default('HEAD'),
      gitCloneUrl: z.string(),
      isAutoApprovalEnabled: z.boolean(),
      repositoryName: z.string(),
    })
    .strip(),
});
