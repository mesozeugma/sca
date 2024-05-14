import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Z_PAGINATION } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex, OpensearchSearch } from '../../opensearch/consts';

const ExplorePackageQueryResult = z
  .object({
    hits: z
      .object({
        hits: z
          .object({
            _source: z
              .object({
                packageName: z.string(),
                className: z.string().optional(),
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

const ExplorePackageQueryParams = z
  .object({
    packageName: z.string(),
    repositoryName: z.string(),
    gitCommit: z.string(),
    pagination: Z_PAGINATION,
  })
  .strict();

export class ExplorePackageQuery {
  params: z.output<typeof ExplorePackageQueryParams>;

  constructor(params: z.input<typeof ExplorePackageQueryParams>) {
    this.params = ExplorePackageQueryParams.parse(params);
  }
}

interface ExplorePackageItem {
  type: 'class' | 'package';
  value: string;
}

@QueryHandler(ExplorePackageQuery)
export class ExplorePackageQueryHandler
  implements IQueryHandler<ExplorePackageQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute({ params }: ExplorePackageQuery) {
    const searchTemplate =
      params.packageName.length > 0
        ? OpensearchSearch.PACKAGE_EXPLORE
        : OpensearchSearch.PACKAGE_EXPLORE_INITIAL;
    const response = await this.opensearch.searchUsingTemplatePaginated(
      searchTemplate,
      OpensearchIndex.ANALYSIS_RESULT_REPOSITORIES,
      params.pagination,
      {
        gitCommit: params.gitCommit,
        packageName: params.packageName,
        repositoryName: params.repositoryName,
      }
    );
    const data = ExplorePackageQueryResult.parse(response);

    const items: ExplorePackageItem[] = data.hits.hits.map(({ _source: e }) => {
      if (e.className !== undefined) {
        return {
          type: 'class',
          value: e.className,
        };
      } else {
        const packageTree = e.packageName.split('.');
        return {
          type: 'package',
          value: packageTree[packageTree.length - 1],
        };
      }
    });

    return {
      items: items,
      totalCount: data.hits.total.value,
    };
  }
}
