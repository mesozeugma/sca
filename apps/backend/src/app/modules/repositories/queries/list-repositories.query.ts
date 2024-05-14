import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryResultTotal } from '../../opensearch/schemas/query.schema';
import { QueryUtils } from '../../opensearch/utils/query-utils';

import { GetRepositoryQueryResultSchema } from './get-repository-by-id.query';

const ListRepositoriesQueryParams = z
  .object({
    filters: z
      .object({ searchText: z.string().default('') })
      .strip()
      .default({}),
    pagination: Z_PAGINATION,
  })
  .strip();

const ListRepositoriesQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: GetRepositoryQueryResultSchema.array(),
        total: QueryResultTotal,
      })
      .strip(),
  })
  .strip();

export class ListRepositoriesQuery {
  params: z.output<typeof ListRepositoriesQueryParams>;

  constructor(params: z.input<typeof ListRepositoriesQueryParams>) {
    this.params = ListRepositoriesQueryParams.parse(params);
  }
}

@QueryHandler(ListRepositoriesQuery)
export class ListRepositoriesQueryHandler
  implements IQueryHandler<ListRepositoriesQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  private createFilter(params: ListRepositoriesQuery['params']) {
    const filter = QueryUtils.createFilter({
      exisitingField: 'repositoryName',
    });

    const repositoryIdFilter = QueryUtils.getWildcardFilter({
      field: 'repositoryName',
      value: params.filters.searchText,
    });
    if (repositoryIdFilter !== undefined) {
      filter.push(repositoryIdFilter);
    }

    return filter;
  }

  async execute({ params }: ListRepositoriesQuery) {
    const queryResponse = await this.opensearch.searchPaginated(
      OpensearchIndex.REPOSITORIES,
      params.pagination,
      {
        query: {
          bool: {
            filter: this.createFilter(params),
          },
        },
        sort: {
          'repositoryName.keyword': { order: 'asc' },
          _id: { order: 'asc' },
        },
      }
    );
    const data = ListRepositoriesQueryResultSchema.parse(queryResponse);
    const items = data.hits.hits.map((e) => ({ ...e._source, id: e._id }));
    return { items, totalCount: data.hits.total.value };
  }
}
