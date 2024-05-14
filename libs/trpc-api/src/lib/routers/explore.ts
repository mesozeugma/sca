import { z } from 'zod';

import { IAuthService } from '../services/auth.service';
import { Pagination, Z_PAGINATION } from '../shared/pagination';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

export interface ExploreClassInput {
  gitCommit: string;
  repositoryName: string;
  searchText: string;
  pagination: Pagination;
}
export interface ExploreClassOutputItem {
  className: string;
  packageName: string;
}
export interface ExploreClassOutput {
  items: ExploreClassOutputItem[];
  totalCount: number;
}

export interface ExplorePackageInput {
  gitCommit: string;
  repositoryName: string;
  packageName: string;
  pagination: Pagination;
}
export interface ExplorePackageOutputItem {
  type: string;
  value: string;
}
export interface ExplorePackageOutput {
  items: ExplorePackageOutputItem[];
  totalCount: number;
}

export interface IExploreController {
  class(input: ExploreClassInput): Promise<ExploreClassOutput>;
  package(input: ExplorePackageInput): Promise<ExplorePackageOutput>;
}

export class ExploreRouter extends BaseRouter {
  readonly instance = router({
    class: publicProcedure
      .input(
        z
          .object({
            gitCommit: z.string(),
            repositoryName: z.string(),
            searchText: z
              .string()
              .min(1)
              .regex(/^[^?*]+$/),
            pagination: Z_PAGINATION,
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z
              .object({ className: z.string(), packageName: z.string() })
              .strict()
              .array(),
            totalCount: z.number().int(),
          })
          .strict()
      )
      .query(async ({ input }) => {
        return this.controller.class(input);
      }),
    package: publicProcedure
      .input(
        z
          .object({
            gitCommit: z.string(),
            repositoryName: z.string(),
            packageName: z.string(),
            pagination: Z_PAGINATION,
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z
              .object({ type: z.string(), value: z.string() })
              .strict()
              .array(),
            totalCount: z.number().int(),
          })
          .strict()
      )
      .query(async ({ input }) => {
        return this.controller.package(input);
      }),
  });

  constructor(
    private readonly controller: IExploreController,
    auth: IAuthService
  ) {
    super(auth);
  }
}
