import { Logger, Optional } from '@nestjs/common';
import {
  CliUtilityService,
  Command,
  CommandRunner,
  Option,
} from 'nest-commander';
import { z } from 'zod';

import { OpensearchClient } from '../client';
import { OpensearchIndex } from '../consts';

const CommandOptions = z
  .object({
    analysisOnly: z.boolean().default(false),
    force: z.boolean().default(false),
  })
  .strict();

@Command({
  name: 'reset-database',
  description: 'Remove all application data from Opensearch',
})
export class ResetDatabaseCommand extends CommandRunner {
  private readonly logger = new Logger(ResetDatabaseCommand.name);
  private readonly analysisIndices: OpensearchIndex[] = [
    OpensearchIndex.ANALYSES,
    OpensearchIndex.ANALYSIS_RESULT_PRIMARY_LINE_COUNTS,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORIES,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORT_ERRORS,
    OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORTS,
    OpensearchIndex.ANALYSIS_RESULT_SEMANTIC,
    OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_ISSUES,
    OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_METRICS,
  ];
  private readonly allIndices: OpensearchIndex[] =
    Object.values(OpensearchIndex);

  constructor(
    private readonly opensearch: OpensearchClient,
    @Optional() private readonly utilityService: CliUtilityService
  ) {
    super();
  }

  @Option({
    flags: '-f --force <force>',
    defaultValue: false,
    description: 'Enable running non-reversable data removal',
  })
  parseForce(value: string) {
    return this.utilityService.parseBoolean(value);
  }

  @Option({
    flags: '--analysis-only <analysisOnly>',
    defaultValue: false,
    description: 'Delete analysis data only',
  })
  parseAnalysisOnly(value: string) {
    return this.utilityService.parseBoolean(value);
  }

  async run(
    _passedParams: string[],
    options?: z.input<typeof CommandOptions> | undefined
  ): Promise<void> {
    const parsedOptions = CommandOptions.parse(options);

    if (!parsedOptions.force) {
      this.logger.error(
        'Option --force must be specified to run this non-reversable action'
      );
      throw new Error();
    }

    const selectedIndices = parsedOptions.analysisOnly
      ? this.analysisIndices
      : this.allIndices;

    for (const index of selectedIndices) {
      this.logger.log(`Deleting index "${index}"`);
      const existed = await this.opensearch.deleteIndex(index);
      if (!existed) {
        this.logger.warn(`Index "${index}" did not exist`);
      }
    }
  }
}
