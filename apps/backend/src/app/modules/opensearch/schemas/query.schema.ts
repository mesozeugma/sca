import { z } from 'zod';

export const QueryResultTotal = z.object({ value: z.number().int() }).strip();
