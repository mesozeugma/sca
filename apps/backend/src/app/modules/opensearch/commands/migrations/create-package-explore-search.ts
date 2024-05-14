import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { OpensearchClient } from '../../client';
import { OpensearchSearch, UNPAGINATED_SIZE_LIMIT } from '../../consts';

import {
  AbstractOpensearchMigration,
  OpensearchMigrationCommand,
} from './abstract-migration';

export class CreatePackageExploreSearchOpensearchMigrationCommand extends OpensearchMigrationCommand {}

@CommandHandler(CreatePackageExploreSearchOpensearchMigrationCommand)
export class CreatePackageExploreSearchOpensearchMigration
  extends AbstractOpensearchMigration
  implements
    ICommandHandler<CreatePackageExploreSearchOpensearchMigrationCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    private readonly opensearch: OpensearchClient
  ) {
    super();
  }

  protected getMigrationName(): string {
    return CreatePackageExploreSearchOpensearchMigration.name;
  }

  private async createPackageExploreSearchInitial() {
    await this.opensearch.createTemplate(
      OpensearchSearch.PACKAGE_EXPLORE_INITIAL,
      {
        script: {
          lang: 'mustache',
          source: {
            query: {
              bool: {
                must: [
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
                  {
                    regexp: {
                      packageName: '[^.]+',
                    },
                  },
                ],
                must_not: [{ exists: { field: 'className' } }],
              },
            },
            sort: {
              packageName: { order: 'asc' },
              _id: { order: 'asc' },
            },
            from: '{{from}}',
            size: '{{size}}',
          },
          params: {
            packageName: '',
            repositoryName: '',
            gitCommit: '',
            from: 0,
            size: UNPAGINATED_SIZE_LIMIT,
          },
        },
      }
    );
  }

  private async createPackageExploreSearch() {
    await this.opensearch.createTemplate(OpensearchSearch.PACKAGE_EXPLORE, {
      script: {
        lang: 'mustache',
        source: {
          query: {
            bool: {
              must: [
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
                  bool: {
                    must: [
                      { exists: { field: 'className' } },
                      {
                        term: {
                          packageName: '{{packageName}}',
                        },
                      },
                    ],
                  },
                },
                {
                  bool: {
                    must: [
                      {
                        regexp: {
                          packageName: '{{packageName}}\\.[^.]+',
                        },
                      },
                    ],
                    must_not: [{ exists: { field: 'className' } }],
                  },
                },
              ],
            },
          },
          sort: {
            className: { missing: '_first', order: 'asc' },
            packageName: { order: 'asc' },
            _id: { order: 'asc' },
          },
          from: '{{from}}',
          size: '{{size}}',
        },
        params: {
          packageName: '',
          repositoryName: '',
          gitCommit: '',
          from: 0,
          size: UNPAGINATED_SIZE_LIMIT,
        },
      },
    });
  }

  protected async doMigration(): Promise<void> {
    await this.createPackageExploreSearchInitial();
    await this.createPackageExploreSearch();
  }
}
