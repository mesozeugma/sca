import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { EarthlyRunnerService } from '../services/earthly-runner.service';

const GetGitLatestCommitUsingEarthlyCommandParamsSchema = z
  .object({
    repositoryGitCloneUrl: z.string(),
    repositoryGitCommitHash: z.string(),
  })
  .strip();

export const GetGitLatestCommitOutput = z
  .object({
    createdAt: z.string().pipe(z.coerce.date()),
    hash: z.string(),
    message: z.string(),
  })
  .strict();

export class GetGitLatestCommitUsingEarthlyCommand {
  params: z.output<typeof GetGitLatestCommitUsingEarthlyCommandParamsSchema>;

  constructor(
    params: z.input<typeof GetGitLatestCommitUsingEarthlyCommandParamsSchema>
  ) {
    this.params =
      GetGitLatestCommitUsingEarthlyCommandParamsSchema.parse(params);
  }
}

@CommandHandler(GetGitLatestCommitUsingEarthlyCommand)
export class GetGitLatestCommitUsingEarthlyCommandHandler
  implements ICommandHandler<GetGitLatestCommitUsingEarthlyCommand>
{
  constructor(protected earthlyRunner: EarthlyRunnerService) {}

  async execute({ params }: GetGitLatestCommitUsingEarthlyCommand) {
    const earthlyResult = await this.earthlyRunner.getResult(
      'git-latest-commit-result',
      {
        REPO_GIT_CLONE_URL: params.repositoryGitCloneUrl,
        REPO_GIT_COMMIT_HASH: params.repositoryGitCommitHash,
      },
      {}
    );
    return {
      success: earthlyResult.success,
      stderr: earthlyResult.stderr,
      stdout: earthlyResult.stdout,
      resultData: earthlyResult.resultData
        ? GetGitLatestCommitOutput.parse(earthlyResult.resultData)
        : undefined,
    };
  }
}
