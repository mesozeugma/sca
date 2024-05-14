import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  DeleteRepetitiveAnalysesCommand,
  DeleteRepetitiveAnalysesCommandHandler,
} from '../../repositories/commands/delete-repetitive-analyses.command';
import {
  DeleteStuckAnalysesCommand,
  DeleteStuckAnalysesCommandHandler,
} from '../../repositories/commands/delete-stuck-analyses.command';
import {
  ListRepetitiveAnalysesQuery,
  ListRepetitiveAnalysesQueryHandler,
} from '../../repositories/queries/list-repetitive-analyses.query';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

@Injectable()
export class AnalysesMaintenanceService {
  private readonly logger = new Logger(AnalysesMaintenanceService.name);

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async deleteRepetitiveAnalyses(): Promise<void> {
    this.logger.debug('Deletion of repetitive analyses started');

    const repetitiveAnalyses =
      await this.queryBus.execute<ListRepetitiveAnalysesQueryHandler>(
        new ListRepetitiveAnalysesQuery()
      );

    for (const analysis of repetitiveAnalyses) {
      const analysisIdentifier = JSON.stringify(analysis);
      this.logger.debug(
        `Deleting repeptitve analyses identified by "${analysisIdentifier}" started`
      );
      await this.commandBus.execute<DeleteRepetitiveAnalysesCommandHandler>(
        new DeleteRepetitiveAnalysesCommand(analysis)
      );
      this.logger.debug(
        `Deleting repeptitve analyses identified by "${analysisIdentifier}" completed`
      );
    }

    this.logger.debug('Deletion of repetitive analyses completed');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteStuckAnalyses(): Promise<void> {
    this.logger.debug('Deletion of stuck analyses started');
    const timeoutSeconds = ONE_DAY_IN_SECONDS;

    this.logger.debug(
      `Deleting stuck analyses using timeout of ${timeoutSeconds}s`
    );
    await this.commandBus.execute<DeleteStuckAnalysesCommandHandler>(
      new DeleteStuckAnalysesCommand({ timeoutSeconds })
    );

    this.logger.debug('Deletion of stuck analyses completed');
  }
}
