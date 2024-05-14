import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GitUtils } from '@sca/executor-lib';
import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { AppCommandBus } from '../../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../../cqrs/query-bus.service';
import {
  GetGitHistoryUsingEarthlyCommand,
  GetGitHistoryUsingEarthlyCommandHandler,
} from '../../../earthly/commands/get-git-history-using-earthly.command';
import {
  GetRepositoryByIdQuery,
  GetRepositoryByIdQueryHandler,
} from '../../../repositories/queries/get-repository-by-id.query';
import { GenericTaskResult } from '../../interfaces/generic-task-result.interface';
import { TaskCommand } from '../../interfaces/task-command.interface';
import {
  CreateAnalyzeRepositoryTaskCommand,
  CreateAnalyzeRepositoryTaskCommandHandler,
} from '../create-analyze-repository-task.command';

const AnalyzeCommitsTaskConfig = z
  .object({
    repositoryId: z.string(),
    repositoryName: z.string(),
    gitCloneUrl: z.string(),
    gitBranch: z.string(),
    isAutoApprovalEnabled: z.boolean(),
  })
  .strict();

export class AnalyzeCommitsTaskCommand implements TaskCommand {
  static readonly taskType = 'analyze_commits';
  params: z.output<typeof AnalyzeCommitsTaskConfig>;

  constructor(params: z.input<typeof AnalyzeCommitsTaskConfig>) {
    this.params = AnalyzeCommitsTaskConfig.parse(params);
  }

  static createFromUnknown(params: Record<string, unknown>) {
    return new AnalyzeCommitsTaskCommand(
      params as z.input<typeof AnalyzeCommitsTaskConfig>
    );
  }

  getDescription(): string {
    return JSON.stringify(this.params);
  }
}

@CommandHandler(AnalyzeCommitsTaskCommand)
export class AnalyzeCommitsTaskCommandHandler
  implements ICommandHandler<AnalyzeCommitsTaskCommand>
{
  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus,
    private readonly gitUtils: GitUtils
  ) {}

  async execute({
    params,
  }: AnalyzeCommitsTaskCommand): Promise<GenericTaskResult> {
    const commitsResult =
      await this.commandBus.execute<GetGitHistoryUsingEarthlyCommandHandler>(
        new GetGitHistoryUsingEarthlyCommand({
          repositoryGitCloneUrl: params.gitCloneUrl,
          repositoryGitCommitHash: params.gitBranch,
        })
      );
    if (!commitsResult.success || commitsResult.resultData === undefined) {
      return new GenericTaskResult(
        TaskStatusType.FAILED,
        commitsResult.stderr,
        commitsResult.stdout
      );
    }
    const relevantCommits = this.gitUtils.getYearlyCommits(
      commitsResult.resultData,
      5
    );
    for await (const commit of relevantCommits) {
      const repository =
        await this.queryBus.execute<GetRepositoryByIdQueryHandler>(
          new GetRepositoryByIdQuery(params.repositoryId)
        );

      await this.commandBus.execute<CreateAnalyzeRepositoryTaskCommandHandler>(
        new CreateAnalyzeRepositoryTaskCommand({
          entity: {
            statusType: params.isAutoApprovalEnabled
              ? TaskStatusType.APPROVED
              : TaskStatusType.WAITING_FOR_APPROVAL,
            repositoryId: params.repositoryId,
            options: {
              buildTool: repository.defaults.buildTool,
              repositoryName: params.repositoryName,
              gitCloneUrl: params.gitCloneUrl,
              gitRef: commit.hash,
              isSonarQubeEnabled: repository.defaults.isSonarQubeEnabled,
              workdir: repository.defaults.workdir,
            },
          },
        })
      );
    }
    return new GenericTaskResult(TaskStatusType.COMPLETED);
  }
}
