import { Logger, Optional } from '@nestjs/common';
import { TaskStatusType } from '@sca/models';
import {
  CliUtilityService,
  Command,
  CommandRunner,
  Option,
} from 'nest-commander';
import { z } from 'zod';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  CreateRepositoryCommand,
  CreateRepositoryCommandHandler,
} from '../../repositories/commands/create-repository.command';
import {
  ListRepositoriesQuery,
  ListRepositoriesQueryHandler,
} from '../../repositories/queries/list-repositories.query';
import {
  CreateAnalyzeRepositoryTaskCommand,
  CreateAnalyzeRepositoryTaskCommandHandler,
} from '../../tasks/commands/create-analyze-repository-task.command';

const CommandOptions = z
  .object({
    force: z.boolean().default(false),
  })
  .strict();

interface RepositorySeed {
  repository: CreateRepositoryCommand['params']['entity'];
  analysisGitCommits: string[];
}

@Command({
  name: 'seed-database',
  description:
    'Fill empty database with predefined set of repositories, tasks, etc.',
})
export class SeedDatabaseCommand extends CommandRunner {
  private readonly logger = new Logger(SeedDatabaseCommand.name);
  private readonly repositoriesSeed: RepositorySeed[] = [
    {
      repository: {
        repositoryName: 'CloudSim',
        gitCloneUrl: 'https://github.com/Cloudslab/cloudsim',
        defaults: {
          buildTool: 'maven',
          javaVersion: 'eclipse-temurin-11',
          pythonVersion: 'none',
          isSonarQubeEnabled: true,
          workdir: '.',
        },
      },
      analysisGitCommits: [
        '725afae528bd9258c20c63e983431cd916588ac1', // 2019-06-18
        'dcb2ac55a8dc463a68ef7825212bb462ebf65a35', // 2020-10-14
      ],
    },
    {
      repository: {
        repositoryName: 'YAFS',
        gitCloneUrl: 'https://github.com/acsicuib/YAFS',
        defaults: {
          buildTool: 'none',
          javaVersion: 'none',
          pythonVersion: '3.10',
          isSonarQubeEnabled: true,
          workdir: '.',
        },
      },
      analysisGitCommits: [
        'adca31ea5929b32a02dd26d03f56b61027333cd6', // 2019-10-17
        '929f1f997861bca1db58e71af95b4f5060d6ef5a', // 2020-11-02
        'b1e903f9c78517ae57d8c20920a855a7c6a59ca8', // 2021-11-11
        '54452ddc3c52157a36990b7a3cde37ef8cf8ef1e', // 2022-11-23
        '5a48b7ca6d5293a3d371a5992e4250116bf1b11c', // 2023-04-17
      ],
    },
    {
      repository: {
        repositoryName: 'DISSECT-CF-Fog',
        gitCloneUrl: 'https://github.com/sed-inf-u-szeged/DISSECT-CF-Fog',
        defaults: {
          buildTool: 'maven',
          javaVersion: 'eclipse-temurin-11',
          pythonVersion: 'none',
          isSonarQubeEnabled: true,
          workdir: 'simulator',
        },
      },
      analysisGitCommits: [
        'f7e84b1498ce06c38050572c8b08d94263195541', // 2024-01-17
        'be11461784de1c64ffc7b380d2cbe85e416bff2f', // 2024-02-12
      ],
    },
    {
      repository: {
        repositoryName: 'DISSECT-CF',
        gitCloneUrl: 'https://github.com/kecskemeti/dissect-cf',
        defaults: {
          buildTool: 'maven',
          javaVersion: 'eclipse-temurin-11',
          pythonVersion: 'none',
          isSonarQubeEnabled: true,
          workdir: '.',
        },
      },
      analysisGitCommits: [
        'c9008738dbac47af406a1a3db2db3cec3bbca0ab', // 2018-11-11
        '4325ccc6a3b280b60bf3642ff5699c0a4c524b9e', // 2019-05-16
        '2a0e8beceb65a6c1fbacef8e05d02eea400b18ba', // 2022-09-13
      ],
    },
  ];

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus,
    @Optional() private readonly utilityService: CliUtilityService
  ) {
    super();
  }

  private async seedRepository(data: RepositorySeed) {
    const { repository } = data;
    this.logger.debug(
      `Started creating repository "${repository.repositoryName}" with ${data.analysisGitCommits.length} analyses`
    );
    const repositoryId =
      await this.commandBus.execute<CreateRepositoryCommandHandler>(
        new CreateRepositoryCommand({ entity: data.repository })
      );
    for (const gitCommit of data.analysisGitCommits) {
      await this.commandBus.execute<CreateAnalyzeRepositoryTaskCommandHandler>(
        new CreateAnalyzeRepositoryTaskCommand({
          entity: {
            options: {
              repositoryName: repository.repositoryName,
              gitCloneUrl: repository.gitCloneUrl,
              gitRef: gitCommit,
              isSonarQubeEnabled: repository.defaults.isSonarQubeEnabled,
              buildTool: repository.defaults.buildTool,
              workdir: repository.defaults.workdir,
            },
            repositoryId,
            statusType: TaskStatusType.APPROVED,
          },
        })
      );
    }
    this.logger.debug(
      `Completed creating repository "${data.repository.repositoryName}"`
    );
  }

  @Option({
    flags: '-f --force <force>',
    defaultValue: false,
    description: 'Do even if database is not empty',
  })
  parseForce(value: string) {
    return this.utilityService.parseBoolean(value);
  }

  async run(
    _passedParams: string[],
    options?: z.input<typeof CommandOptions> | undefined
  ): Promise<void> {
    const parsedOptions = CommandOptions.parse(options);

    const existingRepositories =
      await this.queryBus.execute<ListRepositoriesQueryHandler>(
        new ListRepositoriesQuery({ pagination: { page: 0, limit: 1 } })
      );

    if (existingRepositories.totalCount === 0 || parsedOptions.force) {
      this.logger.debug('Started seeding repositories');
      for (const repository of this.repositoriesSeed) {
        await this.seedRepository(repository);
      }
      this.logger.debug('Completed seeding repositories');
    } else {
      this.logger.warn(
        `Seeding repositories skipped. At least 1 already exists.`
      );
    }
  }
}
