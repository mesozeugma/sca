import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { TaskEntitySchema } from '../entities/task.entity';

export const GetTaskQueryResultSchema = z
  .object({
    _id: z.string(),
    _source: TaskEntitySchema,
  })
  .strip();
export type GetTaskByIdQueryResult = z.infer<
  typeof GetTaskQueryResultSchema
>['_source'];

export class GetTaskByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdQueryHandler
  implements IQueryHandler<GetTaskByIdQuery, GetTaskByIdQueryResult>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(query: GetTaskByIdQuery) {
    const document = await this.opensearch.getDocumentById(
      OpensearchIndex.TASKS,
      query.id
    );

    if (document === undefined) {
      throw new NotFoundException();
    }

    const data = GetTaskQueryResultSchema.parse(document);
    return { ...data._source, id: data._id };
  }
}
