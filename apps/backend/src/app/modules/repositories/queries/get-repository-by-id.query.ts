import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RepositoriesGetByIdOutput } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { RepositoryEntitySchema } from '../entities/repository.entity';

export const GetRepositoryQueryResultSchema = z
  .object({
    _id: z.string(),
    _source: RepositoryEntitySchema,
  })
  .strip();

export class GetRepositoryByIdQuery {
  constructor(public readonly id: string) {}
}

export type GetRepositoryByIdQueryResult = RepositoriesGetByIdOutput;

@QueryHandler(GetRepositoryByIdQuery)
export class GetRepositoryByIdQueryHandler
  implements
    IQueryHandler<GetRepositoryByIdQuery, GetRepositoryByIdQueryResult>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(
    query: GetRepositoryByIdQuery
  ): Promise<GetRepositoryByIdQueryResult> {
    const document = await this.opensearch.getDocumentById(
      OpensearchIndex.REPOSITORIES,
      query.id
    );

    if (document === undefined) {
      throw new NotFoundException();
    }

    const data = GetRepositoryQueryResultSchema.parse(document);
    return { ...data._source, id: data._id };
  }
}
