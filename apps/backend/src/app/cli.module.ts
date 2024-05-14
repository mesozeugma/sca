import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppCommonModule } from './common/common.module';
import { AppCqrsModule } from './cqrs/cqrs.module';
import { OpensearchConfigService } from './modules/opensearch/opensearch.config';
import { OpensearchModule } from './modules/opensearch/opensearch.module';
import { OpensearchDashboardsConfigService } from './modules/opensearch-dashboards/opensearch-dashboards.config';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    AppCommonModule,
    AppCqrsModule,
    ConfigModule.forRoot({
      load: [
        OpensearchConfigService.load,
        OpensearchDashboardsConfigService.load,
      ],
    }),
    OpensearchModule,
    RepositoriesModule,
    TasksModule,
  ],
})
export class CliModule {}
