import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { OpensearchDashboardsModule } from '../opensearch-dashboards/opensearch-dashboards.module';

import { AnalysesMaintenanceService } from './services/analyses-maintenance.service';
import { MonoTaskExecutor } from './services/mono-task-executor.service';
import { OpensearchDashboardsMaintenanceService } from './services/openseach-dashboards-maintenance.service';
import { TasksMaintenanceService } from './services/tasks-maintenance.service';

@Module({
  imports: [
    AppCqrsModule,
    ScheduleModule.forRoot(),
    OpensearchDashboardsModule,
  ],
  providers: [
    AnalysesMaintenanceService,
    MonoTaskExecutor,
    OpensearchDashboardsMaintenanceService,
    TasksMaintenanceService,
  ],
})
export class ScheduledJobsModule {}
