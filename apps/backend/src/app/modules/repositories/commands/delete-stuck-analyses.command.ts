import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus } from '@sca/models';
import { z } from 'zod';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { ListAnalysesQueryResultSchema } from '../queries/list-analyses.query';

import {
  DeleteAnalysisCommand,
  DeleteAnalysisCommandHandler,
} from './delete-analysis.command';

const DeleteStuckAnalysesCommandParamsSchema = z.object({
  timeoutSeconds: z.number().int().min(1),
});

export class DeleteStuckAnalysesCommand {
  params: z.output<typeof DeleteStuckAnalysesCommandParamsSchema>;

  constructor(params: z.input<typeof DeleteStuckAnalysesCommandParamsSchema>) {
    this.params = DeleteStuckAnalysesCommandParamsSchema.parse(params);
  }
}

@CommandHandler(DeleteStuckAnalysesCommand)
export class DeleteStuckAnalysesCommandHandler
  implements ICommandHandler<DeleteStuckAnalysesCommand>
{
  private readonly logger = new Logger(DeleteStuckAnalysesCommandHandler.name);

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly opensearch: OpensearchClient
  ) {}

  private async getStuckAnalysisIds(timeoutSeconds: number) {
    const queryResponse = await this.opensearch.search(
      OpensearchIndex.ANALYSES,
      {
        size: 10,
        query: {
          bool: {
            filter: [
              {
                terms: {
                  'status.type.keyword': [
                    AnalysisStatus.PENDING,
                    AnalysisStatus.PENDING_DELETION,
                  ],
                },
              },
              {
                range: {
                  'status.updatedAt': {
                    lte: `now-${timeoutSeconds}s`,
                  },
                },
              },
            ],
          },
        },
      }
    );

    const data = ListAnalysesQueryResultSchema.parse(queryResponse);
    return data.hits.hits.map((e) => e._id);
  }

  async execute({ params }: DeleteStuckAnalysesCommand): Promise<void> {
    const ids = await this.getStuckAnalysisIds(params.timeoutSeconds);

    for (const id of ids) {
      this.logger.debug(`Deleting stuck analysis with id "${id}" started`);
      await this.commandBus.execute<DeleteAnalysisCommandHandler>(
        new DeleteAnalysisCommand({ id })
      );
      this.logger.debug(`Deleting stuck analysis with id "${id}" completed`);
    }
  }
}
