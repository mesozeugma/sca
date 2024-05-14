import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus } from '@sca/models';
import { z } from 'zod';

import { AppQueryBus } from '../../../cqrs/query-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { AnalysisEntitySchema } from '../entities/analysis.entity';
import {
  GetAnalysisByIdQuery,
  GetAnalysisByIdQueryHandler,
} from '../queries/get-analysis-by-id.query';

const UpdateAnalysisStatusCommandParamsSchema = z.object({
  analysisId: z.string(),
  status: z.nativeEnum(AnalysisStatus),
});

export class UpdateAnalysisStatusCommand {
  params: z.output<typeof UpdateAnalysisStatusCommandParamsSchema>;

  constructor(params: z.input<typeof UpdateAnalysisStatusCommandParamsSchema>) {
    this.params = UpdateAnalysisStatusCommandParamsSchema.parse(params);
  }
}

@CommandHandler(UpdateAnalysisStatusCommand)
export class UpdateAnalysisStatusCommandHandler
  implements ICommandHandler<UpdateAnalysisStatusCommand>
{
  private readonly statusTypeOrder: AnalysisStatus[] = [
    AnalysisStatus.PENDING,
    AnalysisStatus.COMPLETED,
    AnalysisStatus.PENDING_DELETION,
  ];

  constructor(
    private readonly queryBus: AppQueryBus,
    private readonly opensearch: OpensearchClient
  ) {}

  async execute({ params }: UpdateAnalysisStatusCommand): Promise<void> {
    const { id, ...task } =
      await this.queryBus.execute<GetAnalysisByIdQueryHandler>(
        new GetAnalysisByIdQuery(params.analysisId)
      );

    if (
      this.statusTypeOrder.indexOf(task.status.type) >
      this.statusTypeOrder.indexOf(params.status)
    ) {
      throw new BadRequestException();
    }

    const entity: z.input<typeof AnalysisEntitySchema> = {
      ...task,
      status: { type: params.status, updatedAt: new Date().toISOString() },
    };
    await this.opensearch.upsertDocument(
      OpensearchIndex.ANALYSES,
      id,
      AnalysisEntitySchema.parse(entity)
    );
  }
}
