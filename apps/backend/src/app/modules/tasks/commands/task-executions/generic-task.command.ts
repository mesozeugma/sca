import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { AppCommandBus } from '../../../../cqrs/command-bus.service';
import { GenericTaskResult } from '../../interfaces/generic-task-result.interface';

import {
  AnalyzeCommitsTaskCommand,
  AnalyzeCommitsTaskCommandHandler,
} from './analyze-commits-task.command';
import {
  AnalyzeRepositoryTaskCommand,
  AnalyzeRepositoryTaskCommandHandler,
} from './analyze-repository-task.command';

const GenericTaskCommandParams = z
  .object({
    id: z.string(),
    type: z.enum([
      AnalyzeCommitsTaskCommand.taskType,
      AnalyzeRepositoryTaskCommand.taskType,
    ]),
    options: z.object({}).passthrough(),
    repositoryId: z.string().optional(),
  })
  .strict();
type GenericTaskCommandParams = z.infer<typeof GenericTaskCommandParams>;

export class GenericTaskCommand {
  constructor(public readonly params: GenericTaskCommandParams) {
    GenericTaskCommandParams.parse(params);
  }

  static create(value: unknown) {
    return new GenericTaskCommand(value as GenericTaskCommandParams);
  }
}

export class UnknownTaskTypeError extends Error {
  constructor(taskType: string) {
    super(`Task type "${taskType}" is not supported`);
  }
}

@CommandHandler(GenericTaskCommand)
export class GenericTaskCommandHandler
  implements ICommandHandler<GenericTaskCommand>
{
  constructor(private readonly commandBus: AppCommandBus) {}

  async execute({ params }: GenericTaskCommand): Promise<GenericTaskResult> {
    switch (params.type) {
      case AnalyzeCommitsTaskCommand.taskType:
        return this.commandBus.execute<AnalyzeCommitsTaskCommandHandler>(
          AnalyzeCommitsTaskCommand.createFromUnknown({
            ...params.options,
            repositoryId: params.repositoryId,
          })
        );
      case AnalyzeRepositoryTaskCommand.taskType:
        return this.commandBus.execute<AnalyzeRepositoryTaskCommandHandler>(
          AnalyzeRepositoryTaskCommand.createFromUnknown({
            ...params.options,
            repositoryId: params.repositoryId,
            taskId: params.id,
          })
        );
      default:
        throw new UnknownTaskTypeError(params.type);
    }
  }
}
