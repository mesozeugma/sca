import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus } from '@sca/models';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { AnalysisEntitySchema } from '../entities/analysis.entity';

const CreateAnalysisCommandParamsSchema = AnalysisEntitySchema.omit({
  status: true,
  createdAt: true,
}).strict();

export class CreateAnalysisCommand {
  params: z.output<typeof CreateAnalysisCommandParamsSchema>;

  constructor(params: z.input<typeof CreateAnalysisCommandParamsSchema>) {
    this.params = CreateAnalysisCommandParamsSchema.parse(params);
  }
}

@CommandHandler(CreateAnalysisCommand)
export class CreateAnalysisCommandHandler
  implements ICommandHandler<CreateAnalysisCommand>
{
  constructor(protected opensearch: OpensearchClient) {}

  execute({ params }: CreateAnalysisCommand): Promise<string> {
    const createdAt = new Date().toISOString();
    const entity: z.input<typeof AnalysisEntitySchema> = {
      ...params,
      createdAt,
      status: {
        type: AnalysisStatus.PENDING,
        updatedAt: createdAt,
      },
    };
    return this.opensearch.insertDocument(
      OpensearchIndex.ANALYSES,
      AnalysisEntitySchema.parse(entity)
    );
  }
}
