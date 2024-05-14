import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RepositoriesListPublicAnalysesOutput } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { QueryResultTotal } from '../../opensearch/schemas/query.schema';
import { QueryUtils } from '../../opensearch/utils/query-utils';
import { AnalysisEntitySchema } from '../entities/analysis.entity';

const ListPublicAnalysesQueryParams = z
  .object({ repositoryNames: z.string().array(), searchText: z.string() })
  .strict();

const ListPublicAnalysesQueryResultSchema = z
  .object({
    hits: z
      .object({
        hits: z
          .object({
            _id: z.string(),
            _source: AnalysisEntitySchema,
          })
          .array(),
        total: QueryResultTotal,
      })
      .strip(),
  })
  .strip();

export class ListPublicAnalysesQuery {
  params: z.output<typeof ListPublicAnalysesQueryParams>;

  constructor(params: z.input<typeof ListPublicAnalysesQueryParams>) {
    this.params = ListPublicAnalysesQueryParams.parse(params);
  }
}

@QueryHandler(ListPublicAnalysesQuery)
export class ListPublicAnalysesQueryHandler
  implements
    IQueryHandler<
      ListPublicAnalysesQuery,
      RepositoriesListPublicAnalysesOutput
    >
{
  constructor(private readonly opensearch: OpensearchClient) {}

  private createFilter(params: ListPublicAnalysesQuery['params']) {
    const filter = QueryUtils.createFilter({
      exisitingField: 'repository.name',
    });

    const repositoryNameFilter = QueryUtils.getTermsFilter({
      field: 'repository.name',
      values: params.repositoryNames,
    });
    if (repositoryNameFilter !== undefined) {
      filter.push(repositoryNameFilter);
    }

    const dateFilter = QueryUtils.getWildcardFilter({
      field: 'gitCommit.createdAt',
      value: params.searchText,
    });
    if (dateFilter !== undefined) {
      filter.push(dateFilter);
    }

    return filter;
  }

  async execute({
    params,
  }: ListPublicAnalysesQuery): Promise<RepositoriesListPublicAnalysesOutput> {
    const queryResponse = await this.opensearch.search(
      OpensearchIndex.ANALYSES,
      {
        query: {
          bool: {
            filter: this.createFilter(params),
          },
        },
        sort: {
          'gitCommit.createdAt': { order: 'asc' },
          'repository.name.keyword': { order: 'asc' },
          _id: { order: 'asc' },
        },
        size: 100,
      }
    );
    const data = ListPublicAnalysesQueryResultSchema.parse(queryResponse);
    const items = data.hits.hits.map(({ _id, _source }) => ({
      id: _id,
      gitCommit: _source.gitCommit,
      repository: _source.repository,
    }));
    return { items };
  }
}
