import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { TaskEntitySchema } from '../entities/task.entity';

const CreateTaskCommandParamsSchema = z
  .object({
    type: z.string(),
    statusType: z.enum([
      TaskStatusType.WAITING_FOR_APPROVAL,
      TaskStatusType.APPROVED,
    ]),
    options: z.object({}).passthrough(),
    repositoryId: z.string().optional(),
  })
  .strict();

export class CreateTaskCommand {
  params: z.output<typeof CreateTaskCommandParamsSchema>;

  constructor(params: z.input<typeof CreateTaskCommandParamsSchema>) {
    this.params = CreateTaskCommandParamsSchema.parse(params);
  }
}

@CommandHandler(CreateTaskCommand)
export class CreateTaskCommandHandler
  implements ICommandHandler<CreateTaskCommand>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  execute({ params }: CreateTaskCommand): Promise<string> {
    const createdAt = new Date().toISOString();

    const entity: z.input<typeof TaskEntitySchema> = {
      type: params.type,
      createdAt,
      status: { type: params.statusType, updatedAt: createdAt },
      options: params.options,
      repositoryId: params.repositoryId,
    };
    return this.opensearch.insertDocument(
      OpensearchIndex.TASKS,
      TaskEntitySchema.parse(entity)
    );
  }
}
