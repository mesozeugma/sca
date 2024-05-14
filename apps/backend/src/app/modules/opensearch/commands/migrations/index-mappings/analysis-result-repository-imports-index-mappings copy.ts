import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../../client';
import { KEYWORD_MAX_LENGTH, OpensearchIndex } from '../../../consts';
import { IndexMappings } from '../../../schemas/index.schema';
import { FieldMappings } from '../../../utils/field-mappings';
import { IndexMappingsOpensearchMigration } from '../abstract-index-mappings-migration';
import { OpensearchMigrationCommand } from '../abstract-migration';

export class AnalysisResultRepositoryImportsIndexMappingsOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(
  AnalysisResultRepositoryImportsIndexMappingsOpensearchMigrationCommand
)
export class AnalysisResultRepositoryImportsIndexMappingsOpensearchMigration extends IndexMappingsOpensearchMigration {
  protected readonly index = OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORTS;
  protected readonly mappings: z.input<typeof IndexMappings> = {
    dynamic: true,
    properties: {
      file: FieldMappings.text(),
      imported: {
        type: 'keyword',
        copy_to: ['packageReference'],
      },
      packageName: {
        type: 'keyword',
        copy_to: ['packageReference'],
      },
      packageReference: FieldMappings.keywordOnly({
        ignoreAbove: KEYWORD_MAX_LENGTH,
      }),
      type: FieldMappings.keywordOnly({ ignoreAbove: KEYWORD_MAX_LENGTH }),
    },
  };

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }
}
