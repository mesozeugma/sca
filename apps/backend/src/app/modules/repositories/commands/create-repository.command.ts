import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { RepositoryEntitySchema } from '../entities/repository.entity';

const CreateRepositoryCommandParamsSchema = z
  .object({ entity: RepositoryEntitySchema })
  .strict();

export class CreateRepositoryCommand {
  params: z.output<typeof CreateRepositoryCommandParamsSchema>;

  constructor(params: z.input<typeof CreateRepositoryCommandParamsSchema>) {
    this.params = CreateRepositoryCommandParamsSchema.parse(params);
  }
}

@CommandHandler(CreateRepositoryCommand)
export class CreateRepositoryCommandHandler
  implements ICommandHandler<CreateRepositoryCommand>
{
  constructor(protected opensearch: OpensearchClient) {}

  execute({ params }: CreateRepositoryCommand): Promise<string> {
    return this.opensearch.insertDocument(
      OpensearchIndex.REPOSITORIES,
      params.entity
    );
  }
}
