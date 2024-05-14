import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import {
  ODSavedObjectUsageEntityId,
  ODSavedObjectUsageEntitySchema,
} from '../entities/saved-object-usage.entity';
import { TemporarySavedObjectUsedEvent } from '../events/temporary-saved-object-used.event';

@EventsHandler(TemporarySavedObjectUsedEvent)
export class TemporarySavedObjectUsedEventHandler
  implements IEventHandler<TemporarySavedObjectUsedEvent>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  handle(event: TemporarySavedObjectUsedEvent) {
    const entityId: z.input<typeof ODSavedObjectUsageEntityId> = {
      savedObjectId: event.id,
      savedObjectType: event.type,
    };
    const entity: z.input<typeof ODSavedObjectUsageEntitySchema> = {
      ...entityId,
      lastUsedAt: new Date().toISOString(),
    };

    this.opensearch.upsertDocument(
      OpensearchIndex.OD_SAVED_OBJECT_USAGES,
      ODSavedObjectUsageEntityId.parse(entityId),
      ODSavedObjectUsageEntitySchema.parse(entity)
    );
  }
}
