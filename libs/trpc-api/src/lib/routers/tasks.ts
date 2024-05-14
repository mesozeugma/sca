import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { Z_EMPTY_OBJECT } from '../consts';
import { IAuthService } from '../services/auth.service';
import { Pagination, Z_PAGINATION } from '../shared/pagination';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

const GetTaskByIdOutput = z
  .object({
    id: z.string(),
    type: z.string(),
    status: z
      .object({ type: z.nativeEnum(TaskStatusType), updatedAt: z.string() })
      .strict(),
    options: z.object({}).catchall(z.string()),
    log: z.object({ stderr: z.string(), stdout: z.string() }).strict(),
    repositoryId: z.string().optional(),
    createdAt: z.string(),
  })
  .strict();

const TaskListOutput = z
  .object({
    items: GetTaskByIdOutput.omit({ log: true }).array(),
    totalCount: z.number().int(),
  })
  .strict();

export interface TasksApproveInput {
  id: string;
}

export interface TasksGetByIdInput {
  id: string;
}

export interface TasksGetByIdOutput {
  id: string;
  type: string;
  status: TasksListOutputItemStatus;
  options: { [key: string]: string };
  log: TasksListOutputItemLog;
  repositoryId?: string;
  createdAt: string;
}

export interface TasksListInput {
  pagination: Pagination;
}

export interface TasksListOutputItemLog {
  stderr: string;
  stdout: string;
}
export interface TasksListOutputItemStatus {
  type: TaskStatusType;
  updatedAt: string;
}
export interface TasksListOutput {
  items: Omit<TasksGetByIdOutput, 'log'>[];
  totalCount: number;
}

export interface TasksListByRepositoryInput {
  pagination: Pagination;
  repositoryId: string;
}

export interface TasksCreateAnalyzeCommitsTaskInput {
  repositoryId: string;
  gitBranch: string;
  isAutoApprovalEnabled: boolean;
}

export interface TasksCreateAnalyzeRepositoryTaskInput {
  repositoryId: string;
  gitRef: string;
}

export type TasksDeleteInput = TasksApproveInput;

export interface ITasksController {
  approve(input: TasksApproveInput): Promise<void>;
  createAnalyzeCommitsTask(
    input: TasksCreateAnalyzeCommitsTaskInput
  ): Promise<void>;
  createAnalyzeRepositoryTask(
    input: TasksCreateAnalyzeRepositoryTaskInput
  ): Promise<void>;
  delete(input: TasksDeleteInput): Promise<void>;
  getById(input: TasksGetByIdInput): Promise<TasksGetByIdOutput>;
  list(input: TasksListInput): Promise<TasksListOutput>;
  listByRepository(input: TasksListByRepositoryInput): Promise<TasksListOutput>;
}

export class TasksRouter extends BaseRouter {
  readonly instance = router({
    approve: publicProcedure
      .input(z.object({ id: z.string() }))
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.approve(input);
        return {};
      }),
    list: publicProcedure
      .input(z.object({ pagination: Z_PAGINATION }))
      .output(TaskListOutput)
      .query(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        return this.controller.list(input);
      }),
    listByRepository: publicProcedure
      .input(
        z
          .object({ repositoryId: z.string(), pagination: Z_PAGINATION })
          .strict()
      )
      .output(TaskListOutput)
      .query(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        return this.controller.listByRepository(input);
      }),
    createAnalyzeCommitsTask: publicProcedure
      .input(
        z
          .object({
            repositoryId: z.string(),
            gitBranch: z.string().default('HEAD'),
            isAutoApprovalEnabled: z.boolean(),
          })
          .strict()
      )
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.createAnalyzeCommitsTask(input);
        return {};
      }),
    createAnalyzeRepositoryTask: publicProcedure
      .input(
        z.object({ repositoryId: z.string(), gitRef: z.string() }).strict()
      )
      .output(Z_EMPTY_OBJECT)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        await this.controller.createAnalyzeRepositoryTask(input);
        return {};
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
      .output(GetTaskByIdOutput)
      .query(async ({ ctx, input }) => {
        await this.requireAdmin(ctx);

        return this.controller.getById(input);
      }),
  });

  constructor(
    private readonly controller: ITasksController,
    auth: IAuthService
  ) {
    super(auth);
  }
}
