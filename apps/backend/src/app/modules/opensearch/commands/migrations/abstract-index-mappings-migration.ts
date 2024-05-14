import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { OpensearchClient } from '../../client';
import { OpensearchIndex } from '../../consts';
import { IndexMappings } from '../../schemas/index.schema';

import {
  AbstractOpensearchMigration,
  OpensearchMigrationCommand,
} from './abstract-migration';

export abstract class IndexMappingsOpensearchMigration
  extends AbstractOpensearchMigration
  implements ICommandHandler<OpensearchMigrationCommand>
{
  private readonly logger = new Logger(IndexMappingsOpensearchMigration.name);
  protected abstract readonly index: OpensearchIndex;
  protected abstract readonly mappings: z.input<typeof IndexMappings>;
  protected abstract readonly opensearch: OpensearchClient;

  protected getMigrationName(): string {
    return `${IndexMappingsOpensearchMigration.name}.${this.index}`;
  }

  private async ensureIndexExists() {
    try {
      const existing = await this.opensearch.getIndex(this.index);
      if (existing === undefined) {
        await this.opensearch.createIndex(this.index);
        this.logger.debug(`Created index ${this.index}`);
      } else {
        this.logger.debug(`Index ${this.index} already exists`);
      }
    } catch (e) {
      this.logger.error(`Creation of index ${this.index} failed`);
      throw e;
    }
  }

  private async updateIndexMappings() {
    try {
      await this.opensearch.updateIndexMappings(this.index, this.mappings);
    } catch (e) {
      this.logger.error(`Update of mapping for index ${this.index} failed`);
      throw e;
    }
  }

  protected async doMigration(): Promise<void> {
    await this.ensureIndexExists();
    await this.updateIndexMappings();
  }
}
