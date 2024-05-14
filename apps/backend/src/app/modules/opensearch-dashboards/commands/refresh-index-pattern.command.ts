import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import {
  IndexPattern,
  OpensearchDashboardsIndexPatterns,
} from '../services/index-patterns';

const RefreshIndexPatternCommandParamsSchema = z
  .object({
    indexPattern: z.nativeEnum(IndexPattern),
    timeField: z.string().optional(),
  })
  .strict();

export class RefreshIndexPatternCommand {
  params: z.output<typeof RefreshIndexPatternCommandParamsSchema>;

  constructor(params: z.input<typeof RefreshIndexPatternCommandParamsSchema>) {
    this.params = RefreshIndexPatternCommandParamsSchema.parse(params);
  }
}

@CommandHandler(RefreshIndexPatternCommand)
export class RefreshIndexPatternCommandHandler
  implements ICommandHandler<RefreshIndexPatternCommand>
{
  constructor(
    protected indexPatternClient: OpensearchDashboardsIndexPatterns
  ) {}

  async execute({ params }: RefreshIndexPatternCommand): Promise<void> {
    const expectedFields =
      await this.indexPatternClient.getIndexFieldDefinitions(
        params.indexPattern
      );
    const existing = await this.indexPatternClient.getOne(params.indexPattern);
    let existingFields: unknown[] = [];
    if (existing) {
      existingFields =
        await this.indexPatternClient.getIndexPatternFieldDefinitions(
          existing.id
        );
    }
    if (JSON.stringify(existingFields) !== JSON.stringify(expectedFields)) {
      if (existing) {
        // TODO: update instead of delete + create
        await this.indexPatternClient.delete(params.indexPattern);
      }
      await this.indexPatternClient.save(
        params.indexPattern,
        expectedFields,
        params.timeField
      );
    }
  }
}
