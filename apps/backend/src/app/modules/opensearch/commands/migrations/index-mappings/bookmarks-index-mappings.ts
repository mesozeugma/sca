import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class BookmarksIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(BookmarksIndexMappingsOpensearchMigrationCommand)
export class BookmarksIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.BOOKMARKS;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: 'strict',
    properties: {
      name: FieldMappings.keyword(),
      path: FieldMappings.keyword({ ignoreAbove: 1024 }),
      queryParams: FieldMappings.flatObject(),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
