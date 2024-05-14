import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AnalyzeRepositoryUsingEarthlyCommandHandler } from './commands/analyze-repository-using-earthly.command';
import { GetGitHistoryUsingEarthlyCommandHandler } from './commands/get-git-history-using-earthly.command';
import { GetGitLatestCommitUsingEarthlyCommandHandler } from './commands/get-git-latest-commit-using-earthly.command';
import { EarthlyRunnerService } from './services/earthly-runner.service';

const CommandHandlers = [
  AnalyzeRepositoryUsingEarthlyCommandHandler,
  GetGitHistoryUsingEarthlyCommandHandler,
  GetGitLatestCommitUsingEarthlyCommandHandler,
] as const;

@Module({
  imports: [ConfigModule],
  providers: [...CommandHandlers, EarthlyRunnerService],
})
export class EarthlyModule {}
