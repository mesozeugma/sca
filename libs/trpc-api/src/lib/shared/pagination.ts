import { z } from 'zod';

export interface Pagination {
  limit: number;
  page: number;
}

export const DEFAULT_PAGINATION = { page: 0, limit: 100 };
export const Z_PAGINATION = z
  .object({
    limit: z.number().int().min(1).max(100),
    page: z.number().int().min(0),
  })
  .strict()
  .default(DEFAULT_PAGINATION);
