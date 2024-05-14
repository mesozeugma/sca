import { Global, Module } from '@nestjs/common';

import { ShutdownService } from './shutdown.service';

@Global()
@Module({
  exports: [ShutdownService],
  providers: [ShutdownService],
})
export class AppCommonModule {}
