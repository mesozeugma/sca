import { Module } from '@nestjs/common';
import { GitUtils } from '@sca/executor-lib';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { EarthlyModule } from '../earthly/earthly.module';
import { OpensearchModule } from '../opensearch/opensearch.module';

import { CreateAnalyzeRepositoryTaskCommandHandler } from './commands/create-analyze-repository-task.command';
import { CreateTaskCommandHandler } from './commands/create-task.command';
import { DeleteOldTasksCommandHandler } from './commands/delete-old-tasks.command';
import { DeleteTaskCommandHandler } from './commands/delete-task.command';
import { AnalyzeCommitsTaskCommandHandler } from './commands/task-executions/analyze-commits-task.command';
import { AnalyzeRepositoryTaskCommandHandler } from './commands/task-executions/analyze-repository-task.command';
import { GenericTaskCommandHandler } from './commands/task-executions/generic-task.command';
import { UpdateTaskStatusCommandHandler } from './commands/update-task-status.command';
import { TasksTRPCController } from './controllers/tasks.trpc';
import { GetTaskByIdQueryHandler } from './queries/get-task-by-id.query';
import { ListTasksQueryHandler } from './queries/list-tasks.query';

const CommandHandlers = [
  AnalyzeCommitsTaskCommandHandler,
  AnalyzeRepositoryTaskCommandHandler,
  CreateAnalyzeRepositoryTaskCommandHandler,
  CreateTaskCommandHandler,
  DeleteOldTasksCommandHandler,
  DeleteTaskCommandHandler,
  GenericTaskCommandHandler,
  UpdateTaskStatusCommandHandler,
] as const;

const QueryHandlers = [GetTaskByIdQueryHandler, ListTasksQueryHandler] as const;

@Module({
  exports: [TasksTRPCController],
  imports: [AppCqrsModule, EarthlyModule, OpensearchModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: GitUtils, useClass: GitUtils },
    TasksTRPCController,
  ],
})
export class TasksModule {}
