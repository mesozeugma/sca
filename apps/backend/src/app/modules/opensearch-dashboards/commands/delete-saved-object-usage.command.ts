import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';

import {
  AbstractDeleteEntityByIdCommandHandler,
  EntityByIdCommand,
  EntityByIdParams,
} from '../../../common/commands/abstract-entity-by-id.command';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import {
  GetSavedObjectUsageByIdQuery,
  GetSavedObjectUsageByIdQueryHandler,
} from '../queries/get-saved-object-usage-by-id.query';
import { OpensearchDashboardsSavedObjects } from '../services/saved-objects';

export class DeleteSavedObjectUsageCommand extends EntityByIdCommand {
  constructor(params: EntityByIdParams) {
    super(params);
  }
}

@CommandHandler(DeleteSavedObjectUsageCommand)
export class DeleteSavedObjectUsageCommandHandler extends AbstractDeleteEntityByIdCommandHandler {
  protected index: OpensearchIndex = OpensearchIndex.OD_SAVED_OBJECT_USAGES;

  constructor(
    private readonly queryBus: AppQueryBus,
    protected readonly opensearch: OpensearchClient,
    private readonly savedObjects: OpensearchDashboardsSavedObjects
  ) {
    super();
  }

  private async getEntity(id: string) {
    try {
      const entity =
        await this.queryBus.execute<GetSavedObjectUsageByIdQueryHandler>(
          new GetSavedObjectUsageByIdQuery(id)
        );
      return entity;
    } catch (e) {
      if (e instanceof NotFoundException) {
        return undefined;
      }
      throw e;
    }
  }

  protected async beforeEntityDeletion(params: EntityByIdParams) {
    const entity = await this.getEntity(params.id);
    if (entity === undefined) {
      return;
    }

    await this.savedObjects.delete(
      entity.savedObjectType,
      entity.savedObjectId
    );
  }
}
