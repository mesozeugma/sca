import { z } from 'zod';

export const BookmarkEntitySchema = z
  .object({
    name: z.string().min(1),
    path: z.string().min(1),
    queryParams: z.record(z.string().min(1), z.array(z.string().min(1)).min(1)),
  })
  .strip();
