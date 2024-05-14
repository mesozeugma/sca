import { AnalysisStatus } from '@sca/models';
import { z } from 'zod';

export const AnalysisEntitySchema = z
  .object({
    createdAt: z.string(),
    gitCommit: z
      .object({
        createdAt: z.string(),
        hash: z.string().min(1),
        message: z.string(),
      })
      .strip(),
    repository: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
      .strip(),
    status: z
      .object({
        type: z.nativeEnum(AnalysisStatus),
        updatedAt: z.string(),
      })
      .strip(),
    taskId: z.string(),
  })
  .strip();
