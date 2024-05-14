import { Logger } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';

import { CliModule } from './app/cli.module';

async function bootstrap() {
  const app = await CommandFactory.createWithoutRunning(CliModule, {
    logger: new Logger(),
    serviceErrorHandler: (err) => {
      console.log(err);
      process.exit(1);
    },
  });

  await CommandFactory.runApplication(app);
}

bootstrap();
