import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

export const TaskEntitySchema = z
  .object({
    createdAt: z.string(),
    options: z.object({}).passthrough(),
    repositoryId: z.string().optional(),
    status: z
      .object({
        type: z.nativeEnum(TaskStatusType),
        updatedAt: z.string(),
      })
      .strip(),
    type: z.string(),
    log: z
      .object({
        stderr: z.string().default(''),
        stdout: z.string().default(''),
      })
      .strip()
      .default({}),
  })
  .strip();
