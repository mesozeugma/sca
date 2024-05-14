import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex, OpensearchSearch } from '../../opensearch/consts';

const ExploreClassQueryResult = z
  .object({
    hits: z
      .object({
        hits: z
          .object({
            _source: z
              .object({
                packageName: z.string(),
                className: z.string(),
              })
              .strip(),
          })
          .strip()
          .array(),
        total: z.object({ value: z.number().int() }).strip(),
      })
      .strip(),
  })
  .strip();

const ExploreClassQueryParams = z
  .object({
    searchText: z.string(),
    repositoryName: z.string(),
    gitCommit: z.string(),
    pagination: Z_PAGINATION,
  })
  .strict();

export class ExploreClassQuery {
  params: z.output<typeof ExploreClassQueryParams>;

  constructor(params: z.input<typeof ExploreClassQueryParams>) {
    this.params = ExploreClassQueryParams.parse(params);
  }
}

interface ExploreClassItem {
  packageName: string;
  className: string;
}

@QueryHandler(ExploreClassQuery)
export class ExploreClassQueryHandler
  implements IQueryHandler<ExploreClassQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute({ params }: ExploreClassQuery) {
    const response = await this.opensearch.searchUsingTemplatePaginated(
      OpensearchSearch.CLASS_EXPLORE,
      OpensearchIndex.ANALYSIS_RESULT_REPOSITORIES,
      params.pagination,
      {
        searchText: params.searchText,
        gitCommit: params.gitCommit,
        repositoryName: params.repositoryName,
      }
    );
    const data = ExploreClassQueryResult.parse(response);

    const items: ExploreClassItem[] = data.hits.hits.map(({ _source: e }) => ({
      packageName: e.packageName,
      className: e.className,
    }));

    return {
      items: items,
      totalCount: data.hits.total.value,
    };
  }
}
