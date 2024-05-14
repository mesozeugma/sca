import { Module } from '@nestjs/common';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { OpensearchModule } from '../opensearch/opensearch.module';

import { CreateAnalysisCommandHandler } from './commands/create-analysis.command';
import { CreateRepositoryCommandHandler } from './commands/create-repository.command';
import { DeleteAnalysisCommandHandler } from './commands/delete-analysis.command';
import { DeleteRepetitiveAnalysesCommandHandler } from './commands/delete-repetitive-analyses.command';
import { DeleteRepositoryCommandHandler } from './commands/delete-repository.command';
import { DeleteStuckAnalysesCommandHandler } from './commands/delete-stuck-analyses.command';
import { UpdateAnalysisStatusCommandHandler } from './commands/update-analysis-status.command';
import { UpsertRepositoryCommandHandler } from './commands/upsert-repository.command';
import { RepositoriesTRPCController } from './controllers/repositories.trpc';
import { GetAnalysisByIdQueryHandler } from './queries/get-analysis-by-id.query';
import { GetRepositoryByIdQueryHandler } from './queries/get-repository-by-id.query';
import { ListAnalysesQueryHandler } from './queries/list-analyses.query';
import { ListPublicAnalysesQueryHandler } from './queries/list-public-analyses.query';
import { ListRepetitiveAnalysesQueryHandler } from './queries/list-repetitive-analyses.query';
import { ListRepositoriesQueryHandler } from './queries/list-repositories.query';

const CommandHandlers = [
  CreateAnalysisCommandHandler,
  CreateRepositoryCommandHandler,
  DeleteAnalysisCommandHandler,
  DeleteRepetitiveAnalysesCommandHandler,
  DeleteRepositoryCommandHandler,
  DeleteStuckAnalysesCommandHandler,
  UpdateAnalysisStatusCommandHandler,
  UpsertRepositoryCommandHandler,
] as const;

const QueryHandlers = [
  GetAnalysisByIdQueryHandler,
  GetRepositoryByIdQueryHandler,
  ListAnalysesQueryHandler,
  ListPublicAnalysesQueryHandler,
  ListRepetitiveAnalysesQueryHandler,
  ListRepositoriesQueryHandler,
] as const;

@Module({
  exports: [RepositoriesTRPCController],
  imports: [AppCqrsModule, OpensearchModule],
  providers: [...CommandHandlers, ...QueryHandlers, RepositoriesTRPCController],
})
export class RepositoriesModule {}
