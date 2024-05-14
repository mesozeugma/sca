import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { TaskStatusType } from '@sca/models';
import { DEFAULT_PAGINATION } from '@sca/trpc-api';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  GenericTaskCommand,
  GenericTaskCommandHandler,
} from '../../tasks/commands/task-executions/generic-task.command';
import {
  UpdateTaskStatusCommand,
  UpdateTaskStatusCommandHandler,
} from '../../tasks/commands/update-task-status.command';
import {
  ListTasksQuery,
  ListTasksQueryHandler,
} from '../../tasks/queries/list-tasks.query';

interface TaskConfig {
  readonly id: string;
  readonly type: string;
  readonly options: { [key: string]: unknown };
  readonly repositoryId?: string;
}

const CRON_JOB_NAME = 'MonoTaskExecutor.processTasks';

/**
 * Executes one task at a time.
 */
@Injectable()
export class MonoTaskExecutor {
  private readonly logger = new Logger(MonoTaskExecutor.name);

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  private logTaskStatus(startedAt: Date, taskId: string, message: string) {
    const now = new Date();
    const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000;
    this.logger.log(`[${taskId}] [+${elapsedSeconds}s] ${message}`);
  }

  private async updateTaskStatus(
    taskId: string,
    status: TaskStatusType,
    stderr?: string,
    stdout?: string
  ) {
    await this.commandBus.execute<UpdateTaskStatusCommandHandler>(
      new UpdateTaskStatusCommand({ taskId, status, stderr, stdout })
    );
  }

  private async getPendingTasks() {
    try {
      return (
        await this.queryBus.execute<ListTasksQueryHandler>(
          new ListTasksQuery({
            filters: { status: [TaskStatusType.APPROVED] },
            order: 'asc',
            pagination: DEFAULT_PAGINATION,
          })
        )
      ).items;
    } catch (e) {
      this.logger.error(
        `Unexpected error encountered while listing tasks - ${e}`
      );
      return [];
    }
  }

  async executeTask(taskConfig: TaskConfig) {
    const startedAt = new Date();
    try {
      const options = taskConfig.options;
      const command = new GenericTaskCommand({
        id: taskConfig.id,
        type: taskConfig.type as GenericTaskCommand['params']['type'],
        options,
        repositoryId: taskConfig.repositoryId,
      });
      this.logTaskStatus(
        startedAt,
        taskConfig.id,
        `Task ${taskConfig.type} started - ${JSON.stringify(options)}`
      );
      await this.updateTaskStatus(taskConfig.id, TaskStatusType.IN_PROGRESS);
      const taskResult =
        await this.commandBus.execute<GenericTaskCommandHandler>(command);
      await this.updateTaskStatus(
        taskConfig.id,
        taskResult.taskStatus,
        taskResult.stderr,
        taskResult.stdout
      );
      this.logTaskStatus(
        startedAt,
        taskConfig.id,
        `Task ${taskConfig.type} finished with status "${taskResult.taskStatus}"`
      );
    } catch (e) {
      this.logTaskStatus(
        startedAt,
        taskConfig.id,
        `Task ${taskConfig.type} failed - ${e}`
      );
      await this.updateTaskStatus(taskConfig.id, TaskStatusType.FAILED);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: CRON_JOB_NAME })
  async processTasks(): Promise<void> {
    this.logger.debug('Processing of pending tasks started');
    const cronJob = this.schedulerRegistry.getCronJob(CRON_JOB_NAME);
    cronJob.stop();
    const pendingTasks = await this.getPendingTasks();
    if (pendingTasks.length === 0) {
      this.logger.debug('No pending task');
    }
    for await (const task of pendingTasks) {
      try {
        await this.executeTask(task);
      } catch (e) {
        this.logger.error(
          `Unexpected task execution error encountered with task id=${task.id} - ${e}`
        );
      }
    }
    cronJob.start();
    this.logger.debug('Processing of pending tasks completed');
  }
}
