import { Injectable } from '@nestjs/common';
import { TaskStatusType } from '@sca/models';
import {
  ITasksController,
  TasksApproveInput,
  TasksCreateAnalyzeCommitsTaskInput,
  TasksCreateAnalyzeRepositoryTaskInput,
  TasksDeleteInput,
  TasksGetByIdInput,
  TasksListByRepositoryInput,
  TasksListInput,
} from '@sca/trpc-api';
import { z } from 'zod';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  GetRepositoryByIdQuery,
  GetRepositoryByIdQueryHandler,
} from '../../repositories/queries/get-repository-by-id.query';
import {
  CreateAnalyzeRepositoryTaskCommand,
  CreateAnalyzeRepositoryTaskCommandHandler,
} from '../commands/create-analyze-repository-task.command';
import {
  CreateTaskCommand,
  CreateTaskCommandHandler,
} from '../commands/create-task.command';
import {
  DeleteTaskCommand,
  DeleteTaskCommandHandler,
} from '../commands/delete-task.command';
import {
  UpdateTaskStatusCommand,
  UpdateTaskStatusCommandHandler,
} from '../commands/update-task-status.command';
import { AnalyzeCommitsTaskEntitySchema } from '../entities/analyze-commits-task.entity';
import {
  GetTaskByIdQuery,
  GetTaskByIdQueryHandler,
} from '../queries/get-task-by-id.query';
import {
  ListTasksQuery,
  ListTasksQueryHandler,
} from '../queries/list-tasks.query';

const TaskOptionsOutput = z.object({}).catchall(z.coerce.string());

@Injectable()
export class TasksTRPCController implements ITasksController {
  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus
  ) {}

  async approve(input: TasksApproveInput) {
    await this.commandBus.execute<UpdateTaskStatusCommandHandler>(
      new UpdateTaskStatusCommand({
        taskId: input.id,
        status: TaskStatusType.APPROVED,
      })
    );
  }

  async createAnalyzeCommitsTask(input: TasksCreateAnalyzeCommitsTaskInput) {
    const repository =
      await this.queryBus.execute<GetRepositoryByIdQueryHandler>(
        new GetRepositoryByIdQuery(input.repositoryId)
      );

    const options: z.infer<typeof AnalyzeCommitsTaskEntitySchema>['options'] = {
      repositoryName: repository.repositoryName,
      gitCloneUrl: repository.gitCloneUrl,
      gitBranch: input.gitBranch,
      isAutoApprovalEnabled: input.isAutoApprovalEnabled,
    };
    await this.commandBus.execute<CreateTaskCommandHandler>(
      new CreateTaskCommand({
        type: 'analyze_commits',
        statusType: TaskStatusType.APPROVED,
        options: options,
        repositoryId: input.repositoryId,
      })
    );
  }

  async createAnalyzeRepositoryTask(
    input: TasksCreateAnalyzeRepositoryTaskInput
  ) {
    const repository =
      await this.queryBus.execute<GetRepositoryByIdQueryHandler>(
        new GetRepositoryByIdQuery(input.repositoryId)
      );
    await this.commandBus.execute<CreateAnalyzeRepositoryTaskCommandHandler>(
      new CreateAnalyzeRepositoryTaskCommand({
        entity: {
          statusType: TaskStatusType.APPROVED,
          options: {
            buildTool: repository.defaults.buildTool,
            repositoryName: repository.repositoryName,
            gitCloneUrl: repository.gitCloneUrl,
            gitRef: input.gitRef,
            isSonarQubeEnabled: repository.defaults.isSonarQubeEnabled,
            workdir: repository.defaults.workdir,
          },
          repositoryId: input.repositoryId,
        },
      })
    );
  }

  async delete(input: TasksDeleteInput) {
    await this.commandBus.execute<DeleteTaskCommandHandler>(
      new DeleteTaskCommand({ id: input.id })
    );
  }

  async getById(input: TasksGetByIdInput) {
    const entity = await this.queryBus.execute<GetTaskByIdQueryHandler>(
      new GetTaskByIdQuery(input.id)
    );

    return { ...entity, options: TaskOptionsOutput.parse(entity.options) };
  }

  async list(input: TasksListInput) {
    const queryResult = await this.queryBus.execute<ListTasksQueryHandler>(
      new ListTasksQuery({ order: 'desc', pagination: input.pagination })
    );
    return {
      items: queryResult.items.map((e) => {
        const { log: _log, ...task } = e;
        return {
          ...task,
          options: TaskOptionsOutput.parse(e.options),
        };
      }),
      totalCount: queryResult.totalCount,
    };
  }

  async listByRepository(input: TasksListByRepositoryInput) {
    const queryResult = await this.queryBus.execute<ListTasksQueryHandler>(
      new ListTasksQuery({
        filters: { repositoryId: [input.repositoryId] },
        order: 'desc',
        pagination: input.pagination,
      })
    );
    return {
      items: queryResult.items.map((e) => {
        const { log: _log, ...task } = e;
        return {
          ...task,
          options: TaskOptionsOutput.parse(e.options),
        };
      }),
      totalCount: queryResult.totalCount,
    };
  }
}
