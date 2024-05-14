import { Logger } from '@nestjs/common';
import { EventBus, ICommandHandler } from '@nestjs/cqrs';

export class OpensearchMigrationCommand {}

export abstract class AbstractOpensearchMigration
  implements ICommandHandler<OpensearchMigrationCommand, void>
{
  protected abstract readonly eventBus: EventBus;

  protected abstract getMigrationName(): string;
  protected abstract doMigration(): Promise<void>;

  async execute(_command: OpensearchMigrationCommand) {
    const logger = new Logger(AbstractOpensearchMigration.name);
    const migrationName = this.getMigrationName();

    logger.debug(`Opensearch migration ${migrationName} started`);
    await this.doMigration();
    logger.debug(`Opensearch migration ${migrationName} completed`);
  }
}
