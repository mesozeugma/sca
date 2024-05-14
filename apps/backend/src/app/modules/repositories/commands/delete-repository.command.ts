import { CommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus } from '@sca/models';

import {
  AbstractDeleteEntityByIdCommandHandler,
  EntityByIdCommand,
  EntityByIdParams,
} from '../../../common/commands/abstract-entity-by-id.command';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';

export class DeleteRepositoryCommand extends EntityByIdCommand {
  constructor(params: EntityByIdParams) {
    super(params);
  }
}

@CommandHandler(DeleteRepositoryCommand)
export class DeleteRepositoryCommandHandler extends AbstractDeleteEntityByIdCommandHandler {
  protected index: OpensearchIndex = OpensearchIndex.REPOSITORIES;

  constructor(protected opensearch: OpensearchClient) {
    super();
  }

  private async deleteTasks(repositoryId: string) {
    await this.opensearch.deleteByQuery(OpensearchIndex.TASKS, {
      query: {
        term: {
          'repositoryId.keyword': repositoryId,
        },
      },
    });
  }

  private async deleteAnalyses(repositoryId: string) {
    const updatedAt = new Date();

    await this.opensearch.updateByQuery(OpensearchIndex.ANALYSES, {
      query: {
        term: {
          'repository.id.keyword': repositoryId,
        },
      },
      script: {
        source:
          'ctx._source.status.type = params.type; ctx._source.status.updatedAt = params.updatedAt',
        lang: 'painless',
        params: {
          type: AnalysisStatus.PENDING_DELETION,
          updatedAt: updatedAt.toISOString(),
        },
      },
    });
  }

  protected async beforeEntityDeletion(params: EntityByIdParams) {
    await this.deleteTasks(params.id);
    await this.deleteAnalyses(params.id);
  }
}
