import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { OpensearchClient } from '../../client';
import { OpensearchSearch, UNPAGINATED_SIZE_LIMIT } from '../../consts';

import {
  AbstractOpensearchMigration,
  OpensearchMigrationCommand,
} from './abstract-migration';

export class CreateClassExploreSearchOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(CreateClassExploreSearchOpensearchMigrationCommand)
export class CreateClassExploreSearchOpensearchMigration
  extends AbstractOpensearchMigration
  implements
    ICommandHandler<CreateClassExploreSearchOpensearchMigrationCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    private readonly opensearch: OpensearchClient
  ) {
    super();
  }

  protected getMigrationName(): string {
    return CreateClassExploreSearchOpensearchMigration.name;
  }

  private async createClassExploreSearch() {
    await this.opensearch.createTemplate(OpensearchSearch.CLASS_EXPLORE, {
      script: {
        lang: 'mustache',
        source: {
          query: {
            bool: {
              filter: [
                {
                  exists: {
                    field: 'className',
                  },
                },
                {
                  term: {
                    type: {
                      value: 'package_or_class',
                    },
                  },
                },
                {
                  term: {
                    'repository.name.keyword': {
                      value: '{{repositoryName}}',
                    },
                  },
                },
                {
                  term: {
                    'repository.gitCommit.keyword': {
                      value: '{{gitCommit}}',
                    },
                  },
                },
              ],
              minimum_should_match: 1,
              should: [
                {
                  wildcard: {
                    packageName: {
                      value: '*{{searchText}}*',
                      case_insensitive: true,
                    },
                  },
                },
                {
                  wildcard: {
                    className: {
                      value: '*{{searchText}}*',
                      case_insensitive: true,
                    },
                  },
                },
              ],
            },
          },
          sort: {
            packageName: { order: 'asc' },
            className: { order: 'asc' },
            _id: { order: 'asc' },
          },
          from: '{{from}}',
          size: '{{size}}',
        },
        params: {
          searchText: '',
          repositoryName: '',
          gitCommit: '',
          from: 0,
          size: UNPAGINATED_SIZE_LIMIT,
        },
      },
    });
  }

  protected async doMigration(): Promise<void> {
    await this.createClassExploreSearch();
  }
}
