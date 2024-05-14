import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppCqrsModule } from '../../cqrs/cqrs.module';

import { MigrateDatabaseCommand } from './cli/migrate-database.command';
import { ResetDatabaseCommand } from './cli/reset-database.command';
import { SeedDatabaseCommand } from './cli/seed-database.command';
import { OpensearchClient } from './client';
import { CreateClassExploreSearchOpensearchMigration } from './commands/migrations/create-class-explore-search';
import { CreatePackageExploreSearchOpensearchMigration } from './commands/migrations/create-package-explore-search';
import { AnalysesIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/analyses-index-mappings';
import { AnalysisResultRepositoriesIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/analysis-result-repositories-index-mappings';
import { AnalysisResultRepositoryImportsIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/analysis-result-repository-imports-index-mappings copy';
import { BookmarksIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/bookmarks-index-mappings';
import { ODSavedObjectUsagesIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/od-saved-object-usages-index-mappings';
import { RepositoriesIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/repositories-index-mappings';
import { TasksIndexMappingsOpensearchMigration } from './commands/migrations/index-mappings/tasks-index-mappings';
import { OpensearchConfigService } from './opensearch.config';

const CLICommands = [
  MigrateDatabaseCommand,
  ResetDatabaseCommand,
  SeedDatabaseCommand,
] as const;

const CommandHandlers = [
  AnalysesIndexMappingsOpensearchMigration,
  AnalysisResultRepositoriesIndexMappingsOpensearchMigration,
  AnalysisResultRepositoryImportsIndexMappingsOpensearchMigration,
  BookmarksIndexMappingsOpensearchMigration,
  CreateClassExploreSearchOpensearchMigration,
  CreatePackageExploreSearchOpensearchMigration,
  ODSavedObjectUsagesIndexMappingsOpensearchMigration,
  RepositoriesIndexMappingsOpensearchMigration,
  TasksIndexMappingsOpensearchMigration,
] as const;

@Module({
  exports: [OpensearchClient, OpensearchConfigService],
  imports: [AppCqrsModule, ConfigModule],
  providers: [
    ...CLICommands,
    ...CommandHandlers,
    OpensearchClient,
    OpensearchConfigService,
  ],
})
export class OpensearchModule {}
