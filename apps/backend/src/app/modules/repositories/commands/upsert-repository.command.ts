import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RepositoriesGetByIdOutput } from '@sca/trpc-api';
import { z } from 'zod';

import { AppQueryBus } from '../../../cqrs/query-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { RepositoryEntitySchema } from '../entities/repository.entity';
import {
  GetRepositoryByIdQuery,
  GetRepositoryByIdQueryHandler,
} from '../queries/get-repository-by-id.query';

const UpsertRepositoryCommandParamsSchema = z
  .object({
    entity: RepositoryEntitySchema,
    id: z.string(),
  })
  .strict();

export class UpsertRepositoryCommand {
  params: z.output<typeof UpsertRepositoryCommandParamsSchema>;

  constructor(params: z.input<typeof UpsertRepositoryCommandParamsSchema>) {
    this.params = UpsertRepositoryCommandParamsSchema.parse(params);
  }
}

@CommandHandler(UpsertRepositoryCommand)
export class UpsertRepositoryCommandHandler
  implements ICommandHandler<UpsertRepositoryCommand>
{
  constructor(
    private readonly opensearch: OpensearchClient,
    private readonly queryBus: AppQueryBus
  ) {}

  async execute({ params }: UpsertRepositoryCommand): Promise<void> {
    let existing: RepositoriesGetByIdOutput | undefined = undefined;
    try {
      existing = await this.queryBus.execute<GetRepositoryByIdQueryHandler>(
        new GetRepositoryByIdQuery(params.id)
      );
    } catch (e) {
      if (!(e instanceof NotFoundException)) {
        throw e;
      }
    }

    // repositoryName is used as an identifier in multiple places
    // modifying it would require updating it everywhere it is stored
    if (
      existing !== undefined &&
      existing.repositoryName !== params.entity.repositoryName
    ) {
      throw new BadRequestException();
    }

    await this.opensearch.upsertDocument(
      OpensearchIndex.REPOSITORIES,
      params.id,
      params.entity
    );
  }
}
