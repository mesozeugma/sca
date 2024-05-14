import { CommandHandler } from '@nestjs/cqrs';

import {
  AbstractDeleteEntityByIdCommandHandler,
  EntityByIdCommand,
  EntityByIdParams,
} from '../../../common/commands/abstract-entity-by-id.command';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';

export class DeleteTaskCommand extends EntityByIdCommand {
  constructor(params: EntityByIdParams) {
    super(params);
  }
}

@CommandHandler(DeleteTaskCommand)
export class DeleteTaskCommandHandler extends AbstractDeleteEntityByIdCommandHandler {
  protected index: OpensearchIndex = OpensearchIndex.TASKS;

  constructor(protected opensearch: OpensearchClient) {
    super();
  }
}
