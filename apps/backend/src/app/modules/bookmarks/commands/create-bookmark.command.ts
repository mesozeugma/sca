import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { BookmarkEntitySchema } from '../entities/bookmark.entity';

const CreateBookmarkCommandParamsSchema = z
  .object({ entity: BookmarkEntitySchema })
  .strict();

export class CreateBookmarkCommand {
  params: z.output<typeof CreateBookmarkCommandParamsSchema>;

  constructor(params: z.input<typeof CreateBookmarkCommandParamsSchema>) {
    this.params = CreateBookmarkCommandParamsSchema.parse(params);
  }
}

@CommandHandler(CreateBookmarkCommand)
export class CreateBookmarkCommandHandler
  implements ICommandHandler<CreateBookmarkCommand>
{
  constructor(protected opensearch: OpensearchClient) {}

  execute({ params }: CreateBookmarkCommand): Promise<string> {
    return this.opensearch.insertDocument(
      OpensearchIndex.BOOKMARKS,
      params.entity
    );
  }
}
