import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class AnalysesIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(AnalysesIndexMappingsOpensearchMigrationCommand)
export class AnalysesIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.ANALYSES;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: 'strict',
    properties: {
      createdAt: FieldMappings.date(),
      gitCommit: {
        dynamic: 'strict',
        properties: {
          createdAt: FieldMappings.date({ keyword: true }),
          hash: FieldMappings.keyword(),
          message: FieldMappings.keyword(),
        },
      },
      repository: {
        dynamic: 'strict',
        properties: {
          id: FieldMappings.keyword(),
          name: FieldMappings.keyword(),
        },
      },
      status: {
        dynamic: 'strict',
        properties: {
          type: FieldMappings.keyword(),
          updatedAt: FieldMappings.date(),
        },
      },
      taskId: FieldMappings.keyword(),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
