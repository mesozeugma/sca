import { z } from 'zod';

import { Z_EMPTY_OBJECT } from '../consts';
import { IAuthService } from '../services/auth.service';
import { Pagination, Z_PAGINATION } from '../shared/pagination';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

const CreateBookmarkInput = z
  .object({
    name: z.string(),
    path: z.string(),
    queryParams: z.object({}).catchall(z.array(z.string().min(1)).min(1)),
  })
  .strict();
const GetBookmarkByIdOutput = CreateBookmarkInput.extend({ id: z.string() });

export interface BookmarksCreateInput {
  name: string;
  path: string;
  queryParams: { [key: string]: string[] };
}

export interface BookmarksCreateOutput {
  id: string;
}

export interface BookmarksGetByIdInput {
  id: string;
}

export interface BookmarksGetByIdOutput extends BookmarksCreateInput {
  id: string;
}

export interface BookmarksListInputFilters {
  path?: string[];
}
export interface BookmarksListInput {
  filters?: BookmarksListInputFilters;
  pagination: Pagination;
}

export interface BookmarksListOutput {
  items: BookmarksGetByIdOutput[];
  totalCount: number;
}

export interface BookmarksUpsertInput extends BookmarksCreateInput {
  id: string;
}

export interface IBookmarksController {
  create(input: BookmarksCreateInput): Promise<BookmarksCreateOutput>;
  delete(input: BookmarksGetByIdInput): Promise<void>;
  getById(input: BookmarksGetByIdInput): Promise<BookmarksGetByIdOutput>;
  list(input: BookmarksListInput): Promise<BookmarksListOutput>;
  upsert(input: BookmarksUpsertInput): Promise<void>;
}

export class BookmarksRouter extends BaseRouter {
  readonly instance = router({
    create: publicProcedure
      .input(CreateBookmarkInput)
      .output(z.object({ id: z.string() }).strict())
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        return this.controller.create(input);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }).strict())
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.delete(input);
        return {};
      }),
    getById: publicProcedure
      .input(z.object({ id: z.string() }).strict())
      .output(GetBookmarkByIdOutput)
      .query(({ input }) => {
        return this.controller.getById(input);
      }),
    list: publicProcedure
      .input(
        z
          .object({
            filters: z
              .object({ path: z.array(z.string()).optional() })
              .strict()
              .optional(),
            pagination: Z_PAGINATION,
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z.array(GetBookmarkByIdOutput),
            totalCount: z.number().int(),
          })
          .strict()
      )
      .query(({ input }) => {
        return this.controller.list(input);
      }),
    upsert: publicProcedure
      .input(CreateBookmarkInput.extend({ id: z.string() }))
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.upsert(input);
        return {};
      }),
  });

  constructor(
    private readonly controller: IBookmarksController,
    auth: IAuthService
  ) {
    super(auth);
  }
}
