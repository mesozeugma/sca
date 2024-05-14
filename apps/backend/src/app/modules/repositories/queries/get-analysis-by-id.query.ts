import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { AnalysisEntitySchema } from '../entities/analysis.entity';

export const GetAnalysisQueryResultSchema = z
  .object({
    _id: z.string(),
    _source: AnalysisEntitySchema,
  })
  .strip();

export class GetAnalysisByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetAnalysisByIdQuery)
export class GetAnalysisByIdQueryHandler
  implements IQueryHandler<GetAnalysisByIdQuery>
{
  constructor(private readonly opensearch: OpensearchClient) {}

  async execute(query: GetAnalysisByIdQuery) {
    const document = await this.opensearch.getDocumentById(
      OpensearchIndex.ANALYSES,
      query.id
    );

    if (document === undefined) {
      throw new NotFoundException();
    }

    const data = GetAnalysisQueryResultSchema.parse(document);
    return { ...data._source, id: data._id };
  }
}
