import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppTRPCController } from './app.trpc';
import { AppCommonModule } from './common/common.module';
import { AppCqrsModule } from './cqrs/cqrs.module';
import { AuthConfigService } from './modules/auth/auth.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { ExploreModule } from './modules/explore/explore.module';
import { OpensearchConfigService } from './modules/opensearch/opensearch.config';
import { OpensearchModule } from './modules/opensearch/opensearch.module';
import { OpensearchDashboardsConfigService } from './modules/opensearch-dashboards/opensearch-dashboards.config';
import { OpensearchDashboardsModule } from './modules/opensearch-dashboards/opensearch-dashboards.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { ScheduledJobsModule } from './modules/scheduled-jobs/scheduled-jobs.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    AppCommonModule,
    AppCqrsModule,
    AuthModule,
    BookmarksModule,
    ConfigModule.forRoot({
      load: [
        AuthConfigService.load,
        OpensearchConfigService.load,
        OpensearchDashboardsConfigService.load,
      ],
    }),
    ExploreModule,
    OpensearchModule,
    OpensearchDashboardsModule,
    RepositoriesModule,
    ScheduledJobsModule,
    TasksModule,
  ],
  providers: [AppTRPCController],
})
export class AppModule {}
