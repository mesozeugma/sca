import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';

const DeleteOldTasksCommandParamsSchema = z.object({
  olderThan: z.date(),
});

export class DeleteOldTasksCommand {
  params: z.output<typeof DeleteOldTasksCommandParamsSchema>;

  constructor(params: z.input<typeof DeleteOldTasksCommandParamsSchema>) {
    this.params = DeleteOldTasksCommandParamsSchema.parse(params);
  }
}

@CommandHandler(DeleteOldTasksCommand)
export class DeleteOldTasksCommandHandler
  implements ICommandHandler<DeleteOldTasksCommand>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute({ params }: DeleteOldTasksCommand): Promise<void> {
    const currentDate = new Date();
    if (currentDate < params.olderThan) {
      return;
    }

    await this.opensearch.deleteByQuery(OpensearchIndex.TASKS, {
      query: {
        bool: {
          must_not: [
            {
              term: {
                'status.type.keyword': TaskStatusType.WAITING_FOR_APPROVAL,
              },
            },
          ],
          filter: [
            {
              range: {
                'status.updatedAt': {
                  lte: params.olderThan.toISOString(),
                },
              },
            },
          ],
        },
      },
    });
  }
}
