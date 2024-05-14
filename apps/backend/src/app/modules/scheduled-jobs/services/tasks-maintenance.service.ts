import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import {
  DeleteOldTasksCommand,
  DeleteOldTasksCommandHandler,
} from '../../tasks/commands/delete-old-tasks.command';

const CRON_JOB_NAME = 'TasksMaintenanceService.deleteOldTasks';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class TasksMaintenanceService {
  private readonly logger = new Logger(TasksMaintenanceService.name);

  constructor(private readonly commandBus: AppCommandBus) {}

  @Cron(CronExpression.EVERY_HOUR, { name: CRON_JOB_NAME })
  async deleteOldTasks(): Promise<void> {
    this.logger.debug('Deletion of old tasks started');
    const currentDate = new Date();
    const olderThanDate = new Date();

    olderThanDate.setTime(currentDate.getTime() - ONE_DAY_IN_MILLISECONDS * 7);
    this.logger.debug(
      `Deleting tasks older than ${olderThanDate.toISOString()}`
    );

    await this.commandBus.execute<DeleteOldTasksCommandHandler>(
      new DeleteOldTasksCommand({ olderThan: olderThanDate })
    );

    this.logger.debug('Deletion of old tasks completed');
  }
}
