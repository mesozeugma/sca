import { z } from 'zod';

export const BulkItemSchema = z
  .object({ index: z.string(), data: z.object({}).passthrough() })
  .strict();
