import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AnalyzeRepositoryTaskEntitySchema } from '../entities/analyze-repository-task.entity';

import {
  CreateTaskCommand,
  CreateTaskCommandHandler,
} from './create-task.command';

const CreateAnalyzeRepositoryTaskCommandParamsEntitySchema = z
  .object({
    statusType: z.enum([
      TaskStatusType.WAITING_FOR_APPROVAL,
      TaskStatusType.APPROVED,
    ]),
    repositoryId: z.string(),
    options: AnalyzeRepositoryTaskEntitySchema.shape.options.strict(),
  })
  .strict();
const CreateAnalyzeRepositoryTaskCommandParamsSchema = z
  .object({
    entity: CreateAnalyzeRepositoryTaskCommandParamsEntitySchema,
  })
  .strict();

export class CreateAnalyzeRepositoryTaskCommand {
  params: z.output<typeof CreateAnalyzeRepositoryTaskCommandParamsSchema>;

  constructor(
    params: z.input<typeof CreateAnalyzeRepositoryTaskCommandParamsSchema>
  ) {
    this.params = CreateAnalyzeRepositoryTaskCommandParamsSchema.parse(params);
  }
}

@CommandHandler(CreateAnalyzeRepositoryTaskCommand)
export class CreateAnalyzeRepositoryTaskCommandHandler
  implements ICommandHandler<CreateAnalyzeRepositoryTaskCommand>
{
  constructor(private readonly commandBus: AppCommandBus) {}

  execute({
    params: { entity },
  }: CreateAnalyzeRepositoryTaskCommand): Promise<string> {
    return this.commandBus.execute<CreateTaskCommandHandler>(
      new CreateTaskCommand({
        type: 'analyze_repository',
        statusType: entity.statusType,
        options: entity.options,
        repositoryId: entity.repositoryId,
      })
    );
  }
}
