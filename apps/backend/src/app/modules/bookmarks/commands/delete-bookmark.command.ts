import { CommandHandler } from '@nestjs/cqrs';

import {
  AbstractDeleteEntityByIdCommandHandler,
  EntityByIdCommand,
  EntityByIdParams,
} from '../../../common/commands/abstract-entity-by-id.command';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';

export class DeleteBookmarkCommand extends EntityByIdCommand {
  constructor(params: EntityByIdParams) {
    super(params);
  }
}

@CommandHandler(DeleteBookmarkCommand)
export class DeleteBookmarkCommandHandler extends AbstractDeleteEntityByIdCommandHandler {
  protected index: OpensearchIndex = OpensearchIndex.BOOKMARKS;

  constructor(protected opensearch: OpensearchClient) {
    super();
  }
}
