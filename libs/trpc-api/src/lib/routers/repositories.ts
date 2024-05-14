import { AnalysisStatus } from '@sca/models';
import { z } from 'zod';

import { Z_EMPTY_OBJECT } from '../consts';
import { IAuthService } from '../services/auth.service';
import { Pagination, Z_PAGINATION } from '../shared/pagination';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

const CreateRepositoryInput = z
  .object({
    repositoryName: z.string(),
    gitCloneUrl: z.string(),
    defaults: z
      .object({
        buildTool: z.string().min(1),
        javaVersion: z.string().default('none'),
        isSonarQubeEnabled: z.boolean(),
        pythonVersion: z.string().default('none'),
        workdir: z.string().default('.'),
      })
      .strict(),
  })
  .strict();
export interface RepositoriesCreateInputDefaults {
  buildTool: string;
  javaVersion: string;
  isSonarQubeEnabled: boolean;
  pythonVersion: string;
  workdir: string;
}
export interface RepositoriesCreateInput {
  repositoryName: string;
  gitCloneUrl: string;
  defaults: RepositoriesCreateInputDefaults;
}
export interface RepositoriesCreateOutput {
  repositoryId: string;
}

export interface RepositoriesGetByIdInput {
  id: string;
}
const GetByIdOutput = CreateRepositoryInput.extend({ id: z.string() });
export interface RepositoriesGetByIdOutput extends RepositoriesCreateInput {
  id: string;
}

export interface RepositoriesListInputFilters {
  searchText?: string;
}
export interface RepositoriesListInput {
  filters: RepositoriesListInputFilters;
  pagination: Pagination;
}

export interface RepositoriesListOutput {
  items: RepositoriesGetByIdOutput[];
  totalCount: number;
}

export interface RepositoriesListAnalysesInput {
  pagination: Pagination;
  repositoryId: string;
}
export interface RepositoriesListAnalysesOutputItemGitCommit {
  createdAt: string;
  hash: string;
  message: string;
}
export interface RepositoriesListAnalysesOutputItemStatus {
  type: AnalysisStatus;
  updatedAt: string;
}
export interface RepositoriesListAnalysesOutputItem {
  id: string;
  createdAt: string;
  gitCommit: RepositoriesListAnalysesOutputItemGitCommit;
  status: RepositoriesListAnalysesOutputItemStatus;
  taskId: string;
}
export interface RepositoriesListAnalysesOutput {
  items: RepositoriesListAnalysesOutputItem[];
  totalCount: number;
}

export interface RepositoriesListPublicAnalysesInput {
  repositoryNames: string[];
  searchText: string;
}
export interface RepositoriesListPublicAnalysesOutputItemRepository {
  id: string;
  name: string;
}
export interface RepositoriesListPublicAnalysesOutputItem {
  id: string;
  gitCommit: RepositoriesListAnalysesOutputItemGitCommit;
  repository: RepositoriesListPublicAnalysesOutputItemRepository;
}
export interface RepositoriesListPublicAnalysesOutput {
  items: RepositoriesListPublicAnalysesOutputItem[];
}

export interface RepositoriesUpsertInput extends RepositoriesCreateInput {
  repositoryId: string;
}
export interface RepositoriesGetUpsertOptionsOutputDefaults {
  buildTool: string[];
  javaVersion: string[];
  pythonVersion: string[];
}
export interface RepositoriesGetUpsertOptionsOutput {
  defaults: RepositoriesGetUpsertOptionsOutputDefaults;
}

export interface IRepositoriesController {
  create(input: RepositoriesCreateInput): Promise<RepositoriesCreateOutput>;
  delete(input: RepositoriesGetByIdInput): Promise<void>;
  deleteAnalysis(input: RepositoriesGetByIdInput): Promise<void>;
  getById(input: RepositoriesGetByIdInput): Promise<RepositoriesGetByIdOutput>;
  list(input: RepositoriesListInput): Promise<RepositoriesListOutput>;
  listAnalyses(
    input: RepositoriesListAnalysesInput
  ): Promise<RepositoriesListAnalysesOutput>;
  listPublicAnalyses(
    input: RepositoriesListPublicAnalysesInput
  ): Promise<RepositoriesListPublicAnalysesOutput>;
  upsert(input: RepositoriesUpsertInput): Promise<void>;
  getUpsertOptions(): Promise<RepositoriesGetUpsertOptionsOutput>;
}

export class RepositoriesRouter extends BaseRouter {
  readonly instance = router({
    create: publicProcedure
      .input(CreateRepositoryInput)
      .output(z.object({ repositoryId: z.string() }).strict())
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
    deleteAnalysis: publicProcedure
      .input(z.object({ id: z.string() }).strict())
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.deleteAnalysis(input);
        return {};
      }),
    getById: publicProcedure
      .input(z.object({ id: z.string() }).strict())
      .output(GetByIdOutput)
      .query(({ input }) => {
        return this.controller.getById(input);
      }),
    list: publicProcedure
      .input(
        z
          .object({
            filters: z
              .object({ searchText: z.string().default('') })
              .strict()
              .default({}),
            pagination: Z_PAGINATION,
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z.array(GetByIdOutput),
            totalCount: z.number().int(),
          })
          .strict()
      )
      .query(({ input }) => {
        return this.controller.list(input);
      }),
    listAnalyses: publicProcedure
      .input(
        z
          .object({
            repositoryId: z.string(),
            pagination: Z_PAGINATION,
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z.array(
              z.object({
                id: z.string(),
                createdAt: z.string(),
                gitCommit: z
                  .object({
                    createdAt: z.string(),
                    hash: z.string(),
                    message: z.string(),
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
            ),
            totalCount: z.number().int(),
          })
          .strict()
      )
      .query(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        return this.controller.listAnalyses(input);
      }),
    listPublicAnalyses: publicProcedure
      .input(
        z
          .object({
            repositoryNames: z.string().array(),
            searchText: z
              .string()
              .regex(/^[^?*]*$/)
              .default(''),
          })
          .strict()
      )
      .output(
        z
          .object({
            items: z.array(
              z.object({
                id: z.string(),
                gitCommit: z
                  .object({
                    createdAt: z.string(),
                    hash: z.string(),
                    message: z.string(),
                  })
                  .strip(),
                repository: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                  })
                  .strip(),
              })
            ),
          })
          .strict()
      )
      .query(({ input }) => {
        return this.controller.listPublicAnalyses(input);
      }),
    upsert: publicProcedure
      .input(CreateRepositoryInput.extend({ repositoryId: z.string() }))
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.upsert(input);
        return {};
      }),
    getUpsertOptions: publicProcedure
      .input(Z_EMPTY_OBJECT)
      .output(
        z
          .object({
            defaults: z
              .object({
                buildTool: z.string().array(),
                javaVersion: z.string().array(),
                pythonVersion: z.string().array(),
              })
              .strict(),
          })
          .strict()
      )
      .query(() => {
        return this.controller.getUpsertOptions();
      }),
  });

  constructor(
    private readonly controller: IRepositoriesController,
    auth: IAuthService
  ) {
    super(auth);
  }
}
