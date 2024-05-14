import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class RepositoriesIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(RepositoriesIndexMappingsOpensearchMigrationCommand)
export class RepositoriesIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.REPOSITORIES;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: 'strict',
    properties: {
      defaults: {
        dynamic: 'strict',
        properties: {
          buildTool: FieldMappings.keyword(),
          isSonarQubeEnabled: FieldMappings.boolean(),
          javaVersion: FieldMappings.keyword(),
          pythonVersion: FieldMappings.keyword(),
          workdir: FieldMappings.keyword(),
        },
      },
      gitCloneUrl: FieldMappings.keyword(),
      repositoryName: FieldMappings.keyword(),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
