import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { ODSavedObjectUsageEntitySchema } from '../entities/saved-object-usage.entity';

export const GetSavedObjectUsageQueryResultSchema = z
  .object({
    _id: z.string(),
    _source: ODSavedObjectUsageEntitySchema,
  })
  .strip();

export class GetSavedObjectUsageByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetSavedObjectUsageByIdQuery)
export class GetSavedObjectUsageByIdQueryHandler
  implements IQueryHandler<GetSavedObjectUsageByIdQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(query: GetSavedObjectUsageByIdQuery) {
    const document = await this.opensearch.getDocumentById(
      OpensearchIndex.OD_SAVED_OBJECT_USAGES,
      query.id
    );

    if (document === undefined) {
      throw new NotFoundException();
    }

    const data = GetSavedObjectUsageQueryResultSchema.parse(document);
    return { ...data._source, id: data._id };
  }
}
