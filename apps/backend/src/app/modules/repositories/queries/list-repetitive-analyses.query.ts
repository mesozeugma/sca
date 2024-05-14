import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';

export const ListRepetitiveAnalysesAggregationResultSchema = z
  .object({
    aggregations: z
      .object({
        repositories: z
          .object({
            buckets: z
              .object({
                key: z.string(),
                gitCommits: z
                  .object({
                    buckets: z
                      .object({
                        key: z.string(),
                        doc_count: z.number().int().min(2),
                      })
                      .strip()
                      .array(),
                  })
                  .strip(),
              })
              .strip()
              .array(),
          })
          .strip(),
      })
      .strip(),
  })
  .strip();

export class ListRepetitiveAnalysesQuery {}

@QueryHandler(ListRepetitiveAnalysesQuery)
export class ListRepetitiveAnalysesQueryHandler
  implements IQueryHandler<ListRepetitiveAnalysesQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(_: ListRepetitiveAnalysesQuery) {
    const aggregationResponse = await this.opensearch.search(
      OpensearchIndex.ANALYSES,
      {
        size: 0,
        aggregations: {
          repositories: {
            terms: {
              field: 'repository.id.keyword',
            },
            aggregations: {
              gitCommits: {
                terms: {
                  field: 'gitCommit.hash.keyword',
                  min_doc_count: 2,
                },
              },
            },
          },
        },
        query: {
          term: {
            'status.type.keyword': 'completed',
          },
        },
      }
    );
    const data =
      ListRepetitiveAnalysesAggregationResultSchema.parse(aggregationResponse);
    const repositories = data.aggregations.repositories.buckets.map(
      (repository) => ({
        repositoryId: repository.key,
        repetitiveCommits: repository.gitCommits.buckets.map(
          (gitCommit) => gitCommit.key
        ),
      })
    );
    return repositories.flatMap((repository) =>
      repository.repetitiveCommits.map((gitCommit) => ({
        repositoryId: repository.repositoryId,
        gitCommit,
      }))
    );
  }
}
