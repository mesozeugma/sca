import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { BookmarkEntitySchema } from '../entities/bookmark.entity';

const UpsertBookmarkCommandParamsSchema = z
  .object({ entity: BookmarkEntitySchema, id: z.string() })
  .strict();

export class UpsertBookmarkCommand {
  params: z.output<typeof UpsertBookmarkCommandParamsSchema>;

  constructor(params: z.input<typeof UpsertBookmarkCommandParamsSchema>) {
    this.params = UpsertBookmarkCommandParamsSchema.parse(params);
  }
}

@CommandHandler(UpsertBookmarkCommand)
export class UpsertBookmarkCommandHandler
  implements ICommandHandler<UpsertBookmarkCommand>
{
  constructor(protected opensearch: OpensearchClient) {}

  async execute({ params }: UpsertBookmarkCommand): Promise<void> {
    await this.opensearch.upsertDocument(
      OpensearchIndex.BOOKMARKS,
      params.id,
      params.entity
    );
  }
}
