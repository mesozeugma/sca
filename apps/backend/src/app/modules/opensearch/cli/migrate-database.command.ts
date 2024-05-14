import { Command, CommandRunner } from 'nest-commander';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AbstractOpensearchMigration } from '../commands/migrations/abstract-migration';
import { CreateClassExploreSearchOpensearchMigrationCommand } from '../commands/migrations/create-class-explore-search';
import { CreatePackageExploreSearchOpensearchMigrationCommand } from '../commands/migrations/create-package-explore-search';
import { AnalysesIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/analyses-index-mappings';
import { AnalysisResultRepositoriesIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/analysis-result-repositories-index-mappings';
import { AnalysisResultRepositoryImportsIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/analysis-result-repository-imports-index-mappings copy';
import { BookmarksIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/bookmarks-index-mappings';
import { ODSavedObjectUsagesIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/od-saved-object-usages-index-mappings';
import { RepositoriesIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/repositories-index-mappings';
import { TasksIndexMappingsOpensearchMigrationCommand } from '../commands/migrations/index-mappings/tasks-index-mappings';

@Command({
  name: 'migrate-database',
  description: 'Apply Opensearch migrations',
})
export class MigrateDatabaseCommand extends CommandRunner {
  constructor(private readonly commandBus: AppCommandBus) {
    super();
  }

  async run(): Promise<void> {
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new CreateClassExploreSearchOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new CreatePackageExploreSearchOpensearchMigrationCommand()
    );

    await this.commandBus.execute<AbstractOpensearchMigration>(
      new AnalysesIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new AnalysisResultRepositoriesIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new AnalysisResultRepositoryImportsIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new BookmarksIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new ODSavedObjectUsagesIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new RepositoriesIndexMappingsOpensearchMigrationCommand()
    );
    await this.commandBus.execute<AbstractOpensearchMigration>(
      new TasksIndexMappingsOpensearchMigrationCommand()
    );
  }
}
