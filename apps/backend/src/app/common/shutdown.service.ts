import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { ReplaySubject, first, from, mergeMap, tap } from 'rxjs';

@Injectable()
export class ShutdownService {
  private readonly logger = new Logger(ShutdownService.name);
  private readonly shutdownListener = new ReplaySubject<void>(1);

  do() {
    this.shutdownListener.next();
  }

  init(app: INestApplication) {
    this.shutdownListener
      .pipe(
        first(),
        tap(() => {
          this.logger.fatal('Shutdown request received');
        }),
        mergeMap(() => from(app.close()))
      )
      .subscribe(() => {
        process.exit(1);
      });
  }
}
