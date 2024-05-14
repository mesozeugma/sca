import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class ODSavedObjectUsagesIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(ODSavedObjectUsagesIndexMappingsOpensearchMigrationCommand)
export class ODSavedObjectUsagesIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.OD_SAVED_OBJECT_USAGES;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: 'strict',
    properties: {
      lastUsedAt: FieldMappings.date(),
      savedObjectId: FieldMappings.keywordOnly(),
      savedObjectType: FieldMappings.keywordOnly(),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
