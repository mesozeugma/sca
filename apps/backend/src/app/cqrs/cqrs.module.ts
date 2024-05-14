import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AppCommandBus } from './command-bus.service';
import { AppQueryBus } from './query-bus.service';

@Module({
  exports: [AppCommandBus, AppQueryBus, CqrsModule],
  imports: [CqrsModule],
  providers: [AppCommandBus, AppQueryBus],
})
export class AppCqrsModule {}
