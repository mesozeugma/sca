import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class TasksIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(TasksIndexMappingsOpensearchMigrationCommand)
export class TasksIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.TASKS;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: 'strict',
    properties: {
      createdAt: FieldMappings.date(),
      log: {
        dynamic: 'strict',
        properties: {
          stderr: FieldMappings.text(),
          stdout: FieldMappings.text(),
        },
      },
      options: FieldMappings.flatObject(),
      repositoryId: FieldMappings.keyword(),
      status: {
        dynamic: 'strict',
        properties: {
          type: FieldMappings.keyword(),
          updatedAt: FieldMappings.date(),
        },
      },
      type: FieldMappings.keyword(),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
