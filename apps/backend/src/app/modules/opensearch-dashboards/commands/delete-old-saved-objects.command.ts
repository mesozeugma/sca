import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryResultTotal } from '../../opensearch/schemas/query.schema';
import { GetSavedObjectUsageQueryResultSchema } from '../queries/get-saved-object-usage-by-id.query';

import {
  DeleteSavedObjectUsageCommand,
  DeleteSavedObjectUsageCommandHandler,
} from './delete-saved-object-usage.command';

const DeleteOldSavedObjectsCommandParamsSchema = z.object({
  timeoutSeconds: z.number().int().min(1),
});

const OldIdsQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: GetSavedObjectUsageQueryResultSchema.array(),
        total: QueryResultTotal,
      })
      .strip(),
  })
  .strip();

export class DeleteOldSavedObjectsCommand {
  params: z.output<typeof DeleteOldSavedObjectsCommandParamsSchema>;

  constructor(
    params: z.input<typeof DeleteOldSavedObjectsCommandParamsSchema>
  ) {
    this.params = DeleteOldSavedObjectsCommandParamsSchema.parse(params);
  }
}

@CommandHandler(DeleteOldSavedObjectsCommand)
export class DeleteOldSavedObjectsCommandHandler
  implements ICommandHandler<DeleteOldSavedObjectsCommand>
{
  private readonly logger = new Logger(
    DeleteOldSavedObjectsCommandHandler.name
  );

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly opensearch: OpensearchClient
  ) {}

  private async getOldSavedObjectIds(timeoutSeconds: number) {
    const queryResponse = await this.opensearch.search(
      OpensearchIndex.OD_SAVED_OBJECT_USAGES,
      {
        size: 10,
        query: {
          range: {
            lastUsedAt: {
              lte: `now-${timeoutSeconds}s`,
            },
          },
        },
      }
    );

    const data = OldIdsQueryResultSchema.parse(queryResponse);
    return data.hits.hits.map((e) => e._id);
  }

  async execute({ params }: DeleteOldSavedObjectsCommand): Promise<void> {
    const ids = await this.getOldSavedObjectIds(params.timeoutSeconds);

    for (const id of ids) {
      this.logger.debug(`Deleting old saved object with id "${id}" started`);
      await this.commandBus.execute<DeleteSavedObjectUsageCommandHandler>(
        new DeleteSavedObjectUsageCommand({ id })
      );
      this.logger.debug(`Deleting old saved object with id "${id}" completed`);
    }
  }
}
