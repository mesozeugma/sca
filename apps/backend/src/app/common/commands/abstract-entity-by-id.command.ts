import { ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../modules/opensearch/client';
import { OpensearchIndex } from '../../modules/opensearch/consts';

const EntityByIdParams = z.object({ id: z.string() }).strict();
export type EntityByIdParams = z.infer<typeof EntityByIdParams>;

export class EntityByIdCommand {
  constructor(public readonly params: EntityByIdParams) {
    EntityByIdParams.parse(params);
  }
}

export abstract class AbstractDeleteEntityByIdCommandHandler
  implements ICommandHandler<EntityByIdCommand, void>
{
  protected abstract index: OpensearchIndex;
  protected abstract opensearch: OpensearchClient;

  protected beforeEntityDeletion(_params: EntityByIdParams) {
    return Promise.resolve();
  }

  async execute({ params }: EntityByIdCommand): Promise<void> {
    await this.beforeEntityDeletion(params);
    await this.opensearch.deleteDocument(this.index, params.id);
  }
}
