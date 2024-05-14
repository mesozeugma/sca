import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import {
  DeleteOldSavedObjectsCommand,
  DeleteOldSavedObjectsCommandHandler,
} from '../../opensearch-dashboards/commands/delete-old-saved-objects.command';
import {
  RefreshIndexPatternCommand,
  RefreshIndexPatternCommandHandler,
} from '../../opensearch-dashboards/commands/refresh-index-pattern.command';
import { OpensearchDashboardsHTTPClient } from '../../opensearch-dashboards/services/http-client';
import { IndexPattern } from '../../opensearch-dashboards/services/index-patterns';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

@Injectable()
export class OpensearchDashboardsMaintenanceService {
  private readonly logger = new Logger(
    OpensearchDashboardsMaintenanceService.name
  );

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly opensearchDashboardsClient: OpensearchDashboardsHTTPClient
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async deleteOldSavedObjects(): Promise<void> {
    this.logger.debug('Deletion of old saved objects started');
    const timeoutSeconds = ONE_DAY_IN_SECONDS;

    this.logger.debug(
      `Deleting old saved objects using timeout of ${timeoutSeconds}s`
    );
    await this.commandBus.execute<DeleteOldSavedObjectsCommandHandler>(
      new DeleteOldSavedObjectsCommand({ timeoutSeconds })
    );

    this.logger.debug('Deletion of old saved objects completed');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async refreshClientCookie(): Promise<void> {
    await this.opensearchDashboardsClient.getHttpClient();
  }

  /**
   * Some OpenSearch indices use dynamic mapping.
   * This makes it possible that additional fields are added over time to an index.
   * Periodically refreshing index patterns solves this problem.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshIndexPatterns(): Promise<void> {
    this.logger.debug('Refreshing of index patterns started');
    for (const indexPattern of Object.values(IndexPattern)) {
      try {
        this.logger.debug(
          `Refreshing of index pattern "${indexPattern}" started`
        );
        await this.commandBus.execute<RefreshIndexPatternCommandHandler>(
          new RefreshIndexPatternCommand({
            indexPattern,
            timeField: 'repository.date',
          })
        );
        this.logger.debug(
          `Refreshing of index pattern "${indexPattern}" completed`
        );
      } catch (e) {
        this.logger.error(
          `Unexpected error encountered during index pattern refresh indexPattern=${indexPattern} - ${e}`
        );
      }
    }
    this.logger.debug('Refreshing of index patterns completed');
  }
}
