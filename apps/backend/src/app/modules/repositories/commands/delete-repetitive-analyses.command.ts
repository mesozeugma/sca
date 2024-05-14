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

const DeleteRepetitiveAnalysesCommandParamsSchema = z.object({
  repositoryId: z.string().min(1),
  gitCommit: z.string().min(1),
});

export class DeleteRepetitiveAnalysesCommand {
  params: z.output<typeof DeleteRepetitiveAnalysesCommandParamsSchema>;

  constructor(
    params: z.input<typeof DeleteRepetitiveAnalysesCommandParamsSchema>
  ) {
    this.params = DeleteRepetitiveAnalysesCommandParamsSchema.parse(params);
  }
}

@CommandHandler(DeleteRepetitiveAnalysesCommand)
export class DeleteRepetitiveAnalysesCommandHandler
  implements ICommandHandler<DeleteRepetitiveAnalysesCommand>
{
  private readonly logger = new Logger(
    DeleteRepetitiveAnalysesCommandHandler.name
  );

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly opensearch: OpensearchClient
  ) {}

  private async getRepetitiveAnalysisIds(
    params: DeleteRepetitiveAnalysesCommand['params']
  ) {
    const queryResponse = await this.opensearch.search(
      OpensearchIndex.ANALYSES,
      {
        size: 10,
        query: {
          bool: {
            filter: [
              {
                term: {
                  'status.type.keyword': AnalysisStatus.COMPLETED,
                },
              },
              {
                term: {
                  'repository.id.keyword': params.repositoryId,
                },
              },
              {
                term: {
                  'gitCommit.hash.keyword': params.gitCommit,
                },
              },
            ],
          },
        },
        sort: {
          'status.updatedAt': { order: 'asc' },
          createdAt: { order: 'asc' },
          _id: { order: 'asc' },
        },
      }
    );

    const data = ListAnalysesQueryResultSchema.parse(queryResponse);
    return data.hits.hits.map((e) => e._id);
  }

  async execute({ params }: DeleteRepetitiveAnalysesCommand): Promise<void> {
    const ids = await this.getRepetitiveAnalysisIds(params);

    const latestId = ids.pop();
    this.logger.debug(
      `Analysis with id "${latestId}" will be kept while ${ids.length} repetitives are deleted`
    );

    for (const id of ids) {
      this.logger.debug(`Deleting repetitive analysis with id "${id}" started`);
      await this.commandBus.execute<DeleteAnalysisCommandHandler>(
        new DeleteAnalysisCommand({ id })
      );
      this.logger.debug(
        `Deleting repetitive analysis with id "${id}" completed`
      );
    }
  }
}
