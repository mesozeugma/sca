import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { EarthlyRunnerService } from '../services/earthly-runner.service';

const AnalyzeRepositoryUsingEarthlyCommandParamsSchema = z
  .object({
    buildTool: z.string(),
    isSonarQubeEnabled: z.boolean(),
    repositoryGitCloneUrl: z.string(),
    repositoryGitCommitHash: z.string(),
    workdir: z.string(),
  })
  .strip();

const AnalyzeRepositoryOutput = z
  .object({
    index: z.string(),
    data: z.object({}).passthrough(),
  })
  .strict()
  .array();

export class AnalyzeRepositoryUsingEarthlyCommand {
  params: z.output<typeof AnalyzeRepositoryUsingEarthlyCommandParamsSchema>;

  constructor(
    params: z.input<typeof AnalyzeRepositoryUsingEarthlyCommandParamsSchema>
  ) {
    this.params =
      AnalyzeRepositoryUsingEarthlyCommandParamsSchema.parse(params);
  }
}

@CommandHandler(AnalyzeRepositoryUsingEarthlyCommand)
export class AnalyzeRepositoryUsingEarthlyCommandHandler
  implements ICommandHandler<AnalyzeRepositoryUsingEarthlyCommand>
{
  constructor(protected earthlyRunner: EarthlyRunnerService) {}

  async execute({ params }: AnalyzeRepositoryUsingEarthlyCommand) {
    const earthlyResult = await this.earthlyRunner.getResult(
      'analyze-repository-result',
      {
        BUILD_TOOL: params.buildTool,
        REPO_GIT_CLONE_URL: params.repositoryGitCloneUrl,
        REPO_GIT_COMMIT_HASH: params.repositoryGitCommitHash,
        REPO_WORKDIR: params.workdir,
        SONARQUBE_ENABLED: String(params.isSonarQubeEnabled),
      },
      {}
    );
    return {
      success: earthlyResult.success,
      stderr: earthlyResult.stderr,
      stdout: earthlyResult.stdout,
      resultData: earthlyResult.resultData
        ? AnalyzeRepositoryOutput.parse(earthlyResult.resultData)
        : undefined,
    };
  }
}
