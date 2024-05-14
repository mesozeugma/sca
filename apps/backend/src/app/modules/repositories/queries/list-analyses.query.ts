import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryResultTotal } from '../../opensearch/schemas/query.schema';
import { QueryUtils } from '../../opensearch/utils/query-utils';

import { GetAnalysisQueryResultSchema } from './get-analysis-by-id.query';

const ListAnalysesQueryParams = z
  .object({
    filters: z
      .object({ repositoryId: z.string().array().default([]) })
      .strict()
      .default({}),
    pagination: Z_PAGINATION,
  })
  .strict();

export const ListAnalysesQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: GetAnalysisQueryResultSchema.array(),
        total: QueryResultTotal,
      })
      .strip(),
  })
  .strip();

export class ListAnalysesQuery {
  params: z.output<typeof ListAnalysesQueryParams>;

  constructor(params: z.input<typeof ListAnalysesQueryParams>) {
    this.params = ListAnalysesQueryParams.parse(params);
  }
}

@QueryHandler(ListAnalysesQuery)
export class ListAnalysesQueryHandler
  implements IQueryHandler<ListAnalysesQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  private createFilter(params: ListAnalysesQuery['params']) {
    const filter = QueryUtils.createFilter({ exisitingField: 'repository.id' });

    const repositoryIdFilter = QueryUtils.getTermsFilter({
      field: 'repository.id',
      values: params.filters.repositoryId,
    });
    if (repositoryIdFilter !== undefined) {
      filter.push(repositoryIdFilter);
    }

    return filter;
  }

  async execute({ params }: ListAnalysesQuery) {
    const queryResponse = await this.opensearch.searchPaginated(
      OpensearchIndex.ANALYSES,
      params.pagination,
      {
        query: {
          bool: {
            filter: this.createFilter(params),
          },
        },
        sort: {
          createdAt: { order: 'desc' },
          _id: { order: 'asc' },
        },
      }
    );
    const data = ListAnalysesQueryResultSchema.parse(queryResponse);
    const items = data.hits.hits.map((e) => ({ ...e._source, id: e._id }));
    return { items, totalCount: data.hits.total.value };
  }
}
