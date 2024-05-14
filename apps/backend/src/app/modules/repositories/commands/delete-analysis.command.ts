import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus } from '@sca/models';

import {
  AbstractDeleteEntityByIdCommandHandler,
  EntityByIdCommand,
  EntityByIdParams,
} from '../../../common/commands/abstract-entity-by-id.command';
import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import {
  GetAnalysisByIdQuery,
  GetAnalysisByIdQueryHandler,
} from '../queries/get-analysis-by-id.query';

import {
  UpdateAnalysisStatusCommand,
  UpdateAnalysisStatusCommandHandler,
} from './update-analysis-status.command';

export class DeleteAnalysisCommand extends EntityByIdCommand {
  constructor(params: EntityByIdParams) {
    super(params);
  }
}

@CommandHandler(DeleteAnalysisCommand)
export class DeleteAnalysisCommandHandler extends AbstractDeleteEntityByIdCommandHandler {
  protected readonly index = OpensearchIndex.ANALYSES;
  private readonly analysisDataIndices: OpensearchIndex[] = [
    OpensearchIndex.ANALYSIS_RESULT_PRIMARY_LINE_COUNTS,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORIES,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORTS,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORT_ERRORS,
    OpensearchIndex.ANALYSIS_RESULT_SEMANTIC,
    OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_ISSUES,
    OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_METRICS,
  ];

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus,
    protected readonly opensearch: OpensearchClient
  ) {
    super();
  }

  private async getAnalysis(id: string) {
    try {
      return await this.queryBus.execute<GetAnalysisByIdQueryHandler>(
        new GetAnalysisByIdQuery(id)
      );
    } catch (e) {
      if (e instanceof NotFoundException) {
        return undefined;
      }
      throw e;
    }
  }

  private async markAnalysisForDeletion(id: string) {
    await this.commandBus.execute<UpdateAnalysisStatusCommandHandler>(
      new UpdateAnalysisStatusCommand({
        analysisId: id,
        status: AnalysisStatus.PENDING_DELETION,
      })
    );
  }

  private async deleteAnalysisData(id: string) {
    for (const index of this.analysisDataIndices) {
      await this.opensearch.deleteByQuery(index, {
        query: {
          term: {
            'analysis.analysisId.keyword': id,
          },
        },
      });
    }
  }

  protected async beforeEntityDeletion(params: EntityByIdParams) {
    const existing = await this.getAnalysis(params.id);
    if (existing && existing.status.type !== AnalysisStatus.PENDING_DELETION) {
      await this.markAnalysisForDeletion(params.id);
    }

    await this.deleteAnalysisData(params.id);
  }
}
