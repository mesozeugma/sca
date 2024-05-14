import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BookmarksGetByIdOutput } from '@sca/trpc-api';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { BookmarkEntitySchema } from '../entities/bookmark.entity';

export const GetBookmarkQueryResultSchema = z
  .object({
    _id: z.string(),
    _source: BookmarkEntitySchema,
  })
  .strip();

export class GetBookmarkByIdQuery {
  constructor(public readonly id: string) {}
}

export type GetBookmarkByIdQueryResult = BookmarksGetByIdOutput;

@QueryHandler(GetBookmarkByIdQuery)
export class GetBookmarkByIdQueryHandler
  implements IQueryHandler<GetBookmarkByIdQuery, GetBookmarkByIdQueryResult>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(
    query: GetBookmarkByIdQuery
  ): Promise<GetBookmarkByIdQueryResult> {
    const document = await this.opensearch.getDocumentById(
      OpensearchIndex.BOOKMARKS,
      query.id
    );

    if (document === undefined) {
      throw new NotFoundException();
    }

    const data = GetBookmarkQueryResultSchema.parse(document);
    return { ...data._source, id: data._id };
  }
}
