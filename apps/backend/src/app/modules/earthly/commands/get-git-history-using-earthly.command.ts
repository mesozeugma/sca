import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { EarthlyRunnerService } from '../services/earthly-runner.service';

import { GetGitLatestCommitOutput } from './get-git-latest-commit-using-earthly.command';

const GetGitHistoryUsingEarthlyCommandParamsSchema = z
  .object({
    repositoryGitCloneUrl: z.string(),
    repositoryGitCommitHash: z.string(),
  })
  .strip();

const GetGitHistoryOutput = GetGitLatestCommitOutput.array();

export class GetGitHistoryUsingEarthlyCommand {
  params: z.output<typeof GetGitHistoryUsingEarthlyCommandParamsSchema>;

  constructor(
    params: z.input<typeof GetGitHistoryUsingEarthlyCommandParamsSchema>
  ) {
    this.params = GetGitHistoryUsingEarthlyCommandParamsSchema.parse(params);
  }
}

@CommandHandler(GetGitHistoryUsingEarthlyCommand)
export class GetGitHistoryUsingEarthlyCommandHandler
  implements ICommandHandler<GetGitHistoryUsingEarthlyCommand>
{
  constructor(protected earthlyRunner: EarthlyRunnerService) {}

  async execute({ params }: GetGitHistoryUsingEarthlyCommand) {
    const earthlyResult = await this.earthlyRunner.getResult(
      'git-history-result',
      {
        REPO_GIT_CLONE_URL: params.repositoryGitCloneUrl,
        REPO_GIT_COMMIT_HASH: params.repositoryGitCommitHash,
        REPO_GIT_PULL: 'true',
      },
      {}
    );
    return {
      success: earthlyResult.success,
      stderr: earthlyResult.stderr,
      stdout: earthlyResult.stdout,
      resultData: earthlyResult.resultData
        ? GetGitHistoryOutput.parse(earthlyResult.resultData)
        : undefined,
    };
  }
}
