import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TaskStatusType } from '@sca/models';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryUtils } from '../../opensearch/utils/query-utils';

import { GetTaskQueryResultSchema } from './get-task-by-id.query';

const ListTasksQueryParamsSchema = z
  .object({
    filters: z
      .object({
        repositoryId: z.string().array().default([]),
        status: z.nativeEnum(TaskStatusType).array().default([]),
      })
      .strict()
      .default({}),
    order: z.enum(['asc', 'desc']),
    pagination: Z_PAGINATION,
  })
  .strict();

const ListTasksQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: GetTaskQueryResultSchema.array(),
        total: z.object({ value: z.number().int() }).strip(),
      })
      .strip(),
  })
  .strip();

export class ListTasksQuery {
  params: z.output<typeof ListTasksQueryParamsSchema>;

  constructor(params: z.input<typeof ListTasksQueryParamsSchema>) {
    this.params = ListTasksQueryParamsSchema.parse(params);
  }
}

@QueryHandler(ListTasksQuery)
export class ListTasksQueryHandler implements IQueryHandler<ListTasksQuery> {
  constructor(private readonly opensearch: OpensearchClient) {}

  private createFilter(params: ListTasksQuery['params']) {
    const filter = QueryUtils.createFilter({ exisitingField: 'type' });

    const repositoryIdFilter = QueryUtils.getTermsFilter({
      field: 'repositoryId',
      values: params.filters.repositoryId,
    });
    if (repositoryIdFilter !== undefined) {
      filter.push(repositoryIdFilter);
    }

    const statusFilter = QueryUtils.getTermsFilter({
      field: 'status.type',
      values: params.filters.status,
    });
    if (statusFilter !== undefined) {
      filter.push(statusFilter);
    }

    return filter;
  }

  async execute({ params }: ListTasksQuery) {
    const queryResponse = await this.opensearch.searchPaginated(
      OpensearchIndex.TASKS,
      params.pagination,
      {
        query: {
          bool: {
            filter: this.createFilter(params),
          },
        },
        sort: {
          createdAt: { order: params.order },
          _id: { order: 'asc' },
        },
      }
    );
    const data = ListTasksQueryResultSchema.parse(queryResponse);
    const items = data.hits.hits.map((e) => ({ ...e._source, id: e._id }));
    return { items, totalCount: data.hits.total.value };
  }
}
