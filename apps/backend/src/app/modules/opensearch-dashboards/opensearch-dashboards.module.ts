import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { OpensearchModule } from '../opensearch/opensearch.module';

import { DeleteOldSavedObjectsCommandHandler } from './commands/delete-old-saved-objects.command';
import { DeleteSavedObjectUsageCommandHandler } from './commands/delete-saved-object-usage.command';
import { RefreshIndexPatternCommandHandler } from './commands/refresh-index-pattern.command';
import { DashboardsTRPCController } from './controllers/dashboards.trpc';
import { TemporarySavedObjectUsedEventHandler } from './event-handlers/temporary-saved-object-used.event-handler';
import { OpensearchDashboardsConfigService } from './opensearch-dashboards.config';
import { GetSavedObjectUsageByIdQueryHandler } from './queries/get-saved-object-usage-by-id.query';
import { OpensearchDashboardsDashboards } from './services/dashboards';
import { OpensearchDashboardsHTTPClient } from './services/http-client';
import { OpensearchDashboardsIndexPatterns } from './services/index-patterns';
import { OpensearchDashboardsSavedObjects } from './services/saved-objects';
import { OpensearchDashboardsSearches } from './services/saved-searchs';
import { OpensearchDashboardsVisualizations } from './services/visualizations';

const CommandHandlers = [
  DeleteOldSavedObjectsCommandHandler,
  DeleteSavedObjectUsageCommandHandler,
  RefreshIndexPatternCommandHandler,
] as const;

const EventHandlers = [TemporarySavedObjectUsedEventHandler] as const;

const QueryHandlers = [GetSavedObjectUsageByIdQueryHandler] as const;

@Module({
  exports: [
    DashboardsTRPCController,
    OpensearchDashboardsConfigService,
    OpensearchDashboardsDashboards,
    OpensearchDashboardsHTTPClient,
  ],
  imports: [AppCqrsModule, ConfigModule, OpensearchModule],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    DashboardsTRPCController,
    OpensearchDashboardsConfigService,
    OpensearchDashboardsDashboards,
    OpensearchDashboardsHTTPClient,
    OpensearchDashboardsIndexPatterns,
    OpensearchDashboardsSavedObjects,
    OpensearchDashboardsSearches,
    OpensearchDashboardsVisualizations,
  ],
})
export class OpensearchDashboardsModule {}
