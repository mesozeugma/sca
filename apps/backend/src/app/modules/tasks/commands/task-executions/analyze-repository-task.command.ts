import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalysisStatus, TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { AppCommandBus } from '../../../../cqrs/command-bus.service';
import {
  AnalyzeRepositoryUsingEarthlyCommand,
  AnalyzeRepositoryUsingEarthlyCommandHandler,
} from '../../../earthly/commands/analyze-repository-using-earthly.command';
import {
  GetGitLatestCommitUsingEarthlyCommand,
  GetGitLatestCommitUsingEarthlyCommandHandler,
} from '../../../earthly/commands/get-git-latest-commit-using-earthly.command';
import { OpensearchClient } from '../../../opensearch/client';
import {
  CreateAnalysisCommand,
  CreateAnalysisCommandHandler,
} from '../../../repositories/commands/create-analysis.command';
import {
  DeleteAnalysisCommand,
  DeleteAnalysisCommandHandler,
} from '../../../repositories/commands/delete-analysis.command';
import {
  UpdateAnalysisStatusCommand,
  UpdateAnalysisStatusCommandHandler,
} from '../../../repositories/commands/update-analysis-status.command';
import { GenericTaskResult } from '../../interfaces/generic-task-result.interface';
import { TaskCommand } from '../../interfaces/task-command.interface';

const AnalyzeRepositoryTaskConfig = z
  .object({
    taskId: z.string(),
    buildTool: z.string(),
    repositoryId: z.string(),
    repositoryName: z.string(),
    gitCloneUrl: z.string(),
    gitRef: z.string(),
    isSonarQubeEnabled: z.boolean().default(false),
    workdir: z.string().default('.'),
  })
  .strict();

export class AnalyzeRepositoryTaskCommand implements TaskCommand {
  static readonly taskType = 'analyze_repository';
  params: z.output<typeof AnalyzeRepositoryTaskConfig>;

  constructor(params: z.input<typeof AnalyzeRepositoryTaskConfig>) {
    this.params = AnalyzeRepositoryTaskConfig.parse(params);
  }

  static createFromUnknown(params: Record<string, unknown>) {
    return new AnalyzeRepositoryTaskCommand(
      params as z.input<typeof AnalyzeRepositoryTaskConfig>
    );
  }

  getDescription(): string {
    return JSON.stringify(this.params);
  }
}

@CommandHandler(AnalyzeRepositoryTaskCommand)
export class AnalyzeRepositoryTaskCommandHandler
  implements ICommandHandler<AnalyzeRepositoryTaskCommand>
{
  private readonly logger = new Logger(
    AnalyzeRepositoryTaskCommandHandler.name
  );

  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly opensearchClient: OpensearchClient
  ) {}

  private async getCommitInfo(gitCloneUrl: string, gitRef: string) {
    const commitResult =
      await this.commandBus.execute<GetGitLatestCommitUsingEarthlyCommandHandler>(
        new GetGitLatestCommitUsingEarthlyCommand({
          repositoryGitCloneUrl: gitCloneUrl,
          repositoryGitCommitHash: gitRef,
        })
      );
    const latestCommit = commitResult.resultData;
    if (!commitResult.success || latestCommit === undefined) {
      throw new GenericTaskResult(
        TaskStatusType.FAILED,
        commitResult.stderr,
        commitResult.stdout
      );
    }
    return latestCommit;
  }

  private async analyzeRepository(
    params: AnalyzeRepositoryTaskCommand['params']
  ) {
    const analysisResult =
      await this.commandBus.execute<AnalyzeRepositoryUsingEarthlyCommandHandler>(
        new AnalyzeRepositoryUsingEarthlyCommand({
          buildTool: params.buildTool,
          repositoryGitCloneUrl: params.gitCloneUrl,
          repositoryGitCommitHash: params.gitRef,
          isSonarQubeEnabled: params.isSonarQubeEnabled,
          workdir: params.workdir,
        })
      );
    const result = analysisResult.resultData;
    if (!analysisResult.success || result === undefined) {
      throw new GenericTaskResult(
        TaskStatusType.FAILED,
        analysisResult.stderr,
        analysisResult.stdout
      );
    }
    return result;
  }

  private async deleteAnalysis(analysisId: string) {
    try {
      await this.commandBus.execute<DeleteAnalysisCommandHandler>(
        new DeleteAnalysisCommand({ id: analysisId })
      );
    } catch (e) {
      this.logger.error('Failed to delete incomplete analysis');
    }
  }

  private async storeResult(
    params: AnalyzeRepositoryTaskCommand['params'],
    commitInfo: Awaited<
      ReturnType<AnalyzeRepositoryTaskCommandHandler['getCommitInfo']>
    >,
    analysisId: string,
    analysisResult: Awaited<
      ReturnType<AnalyzeRepositoryTaskCommandHandler['analyzeRepository']>
    >
  ) {
    try {
      await this.opensearchClient.insertBulk(
        analysisResult.map(({ index, data }) => ({
          index,
          data: {
            ...data,
            repository: {
              name: params.repositoryName,
              gitCommit: params.gitRef,
              date: commitInfo.createdAt.toISOString(),
            },
            analysis: {
              analysisId,
              taskId: params.taskId,
            },
          },
        }))
      );
    } catch (e) {
      await this.deleteAnalysis(analysisId);
      throw e;
    }

    await this.commandBus.execute<UpdateAnalysisStatusCommandHandler>(
      new UpdateAnalysisStatusCommand({
        analysisId,
        status: AnalysisStatus.COMPLETED,
      })
    );
  }

  async execute({
    params,
  }: AnalyzeRepositoryTaskCommand): Promise<GenericTaskResult> {
    try {
      const commitInfo = await this.getCommitInfo(
        params.gitCloneUrl,
        params.gitRef
      );

      const analysisResult = await this.analyzeRepository(params);
      const analysisId =
        await this.commandBus.execute<CreateAnalysisCommandHandler>(
          new CreateAnalysisCommand({
            gitCommit: {
              hash: commitInfo.hash,
              message: commitInfo.message,
              createdAt: commitInfo.createdAt.toISOString(),
            },
            repository: {
              id: params.repositoryId,
              name: params.repositoryName,
            },
            taskId: params.taskId,
          })
        );

      await this.storeResult(params, commitInfo, analysisId, analysisResult);
      return new GenericTaskResult(TaskStatusType.COMPLETED);
    } catch (e) {
      if (e instanceof GenericTaskResult) {
        return e;
      }
      throw e;
    }
  }
}
