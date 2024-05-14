import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { AppTRPCController } from './app/app.trpc';
import { ShutdownService } from './app/common/shutdown.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.enableShutdownHooks();
  app.get(ShutdownService).init(app);
  app.get(AppTRPCController).init(app);

  await app.listen(port);
}

bootstrap();
