import { Injectable } from '@nestjs/common';
import {
  IRepositoriesController,
  RepositoriesCreateInput,
  RepositoriesGetByIdInput,
  RepositoriesListAnalysesInput,
  RepositoriesListInput,
  RepositoriesListPublicAnalysesInput,
  RepositoriesUpsertInput,
} from '@sca/trpc-api';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  CreateRepositoryCommand,
  CreateRepositoryCommandHandler,
} from '../commands/create-repository.command';
import {
  DeleteAnalysisCommand,
  DeleteAnalysisCommandHandler,
} from '../commands/delete-analysis.command';
import {
  DeleteRepositoryCommand,
  DeleteRepositoryCommandHandler,
} from '../commands/delete-repository.command';
import {
  UpsertRepositoryCommand,
  UpsertRepositoryCommandHandler,
} from '../commands/upsert-repository.command';
import {
  GetRepositoryByIdQuery,
  GetRepositoryByIdQueryHandler,
} from '../queries/get-repository-by-id.query';
import {
  ListAnalysesQuery,
  ListAnalysesQueryHandler,
} from '../queries/list-analyses.query';
import {
  ListPublicAnalysesQuery,
  ListPublicAnalysesQueryHandler,
} from '../queries/list-public-analyses.query';
import {
  ListRepositoriesQuery,
  ListRepositoriesQueryHandler,
} from '../queries/list-repositories.query';

@Injectable()
export class RepositoriesTRPCController implements IRepositoriesController {
  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus
  ) {}

  async create(input: RepositoriesCreateInput) {
    return {
      repositoryId:
        await this.commandBus.execute<CreateRepositoryCommandHandler>(
          new CreateRepositoryCommand({ entity: { ...input } })
        ),
    };
  }

  async delete(input: RepositoriesGetByIdInput) {
    await this.commandBus.execute<DeleteRepositoryCommandHandler>(
      new DeleteRepositoryCommand({ id: input.id })
    );
  }

  async deleteAnalysis(input: RepositoriesGetByIdInput): Promise<void> {
    await this.commandBus.execute<DeleteAnalysisCommandHandler>(
      new DeleteAnalysisCommand({ id: input.id })
    );
  }

  getById(input: RepositoriesGetByIdInput) {
    return this.queryBus.execute<GetRepositoryByIdQueryHandler>(
      new GetRepositoryByIdQuery(input.id)
    );
  }

  async list(input: RepositoriesListInput) {
    const queryResult =
      await this.queryBus.execute<ListRepositoriesQueryHandler>(
        new ListRepositoriesQuery(input)
      );
    return {
      items: queryResult.items,
      totalCount: queryResult.totalCount,
    };
  }

  async listAnalyses(input: RepositoriesListAnalysesInput) {
    const queryResult = await this.queryBus.execute<ListAnalysesQueryHandler>(
      new ListAnalysesQuery({
        filters: { repositoryId: [input.repositoryId] },
        pagination: input.pagination,
      })
    );
    return {
      items: queryResult.items.map(({ repository: _repository, ...e }) => e),
      totalCount: queryResult.totalCount,
    };
  }

  listPublicAnalyses(input: RepositoriesListPublicAnalysesInput) {
    return this.queryBus.execute<ListPublicAnalysesQueryHandler>(
      new ListPublicAnalysesQuery({
        repositoryNames: input.repositoryNames,
        searchText: input.searchText,
      })
    );
  }

  async upsert(input: RepositoriesUpsertInput) {
    const { repositoryId, ...content } = input;
    await this.commandBus.execute<UpsertRepositoryCommandHandler>(
      new UpsertRepositoryCommand({ id: repositoryId, entity: content })
    );
  }

  getUpsertOptions() {
    return Promise.resolve({
      defaults: {
        buildTool: ['none', 'maven'],
        javaVersion: ['none', 'eclipse-temurin-11'],
        pythonVersion: ['none', '3.10'],
      },
    });
  }
}
