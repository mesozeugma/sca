import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryUtils } from '../../opensearch/utils/query-utils';

import { GetBookmarkQueryResultSchema } from './get-bookmark-by-id.query';

const ListBookmarksQueryParams = z
  .object({
    filters: z
      .object({ path: z.string().array().default([]) })
      .strict()
      .default({}),
    pagination: Z_PAGINATION,
  })
  .strict();

const ListBookmarksQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: GetBookmarkQueryResultSchema.array(),
        total: z.object({ value: z.number().int() }).strip(),
      })
      .strip(),
  })
  .strip();

export class ListBookmarksQuery {
  params: z.output<typeof ListBookmarksQueryParams>;

  constructor(params: z.input<typeof ListBookmarksQueryParams>) {
    this.params = ListBookmarksQueryParams.parse(params);
  }
}

@QueryHandler(ListBookmarksQuery)
export class ListBookmarksQueryHandler
  implements IQueryHandler<ListBookmarksQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  private createFilter(params: ListBookmarksQuery['params']) {
    const filter = QueryUtils.createFilter({ exisitingField: 'path' });

    const pathFilter = QueryUtils.getTermsFilter({
      field: 'path',
      values: params.filters.path,
    });
    if (pathFilter !== undefined) {
      filter.push(pathFilter);
    }

    return filter;
  }

  async execute({ params }: ListBookmarksQuery) {
    const queryResponse = await this.opensearch.searchPaginated(
      OpensearchIndex.BOOKMARKS,
      params.pagination,
      {
        query: {
          bool: {
            filter: this.createFilter(params),
          },
        },
        sort: {
          'name.keyword': { order: 'asc' },
          _id: { order: 'asc' },
        },
      }
    );
    const data = ListBookmarksQueryResultSchema.parse(queryResponse);
    const items = data.hits.hits.map((e) => ({ ...e._source, id: e._id }));
    return { items, totalCount: data.hits.total.value };
  }
}
