import { Injectable } from '@nestjs/common';
import { CommandOutput, Utils } from '@sca/executor-lib';
import * as fs from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';

type EarthlyArgs = { [key: string]: string };

export interface EarthlyResult<T = unknown> extends CommandOutput {
  readonly resultData?: T;
}

@Injectable()
export class EarthlyRunnerService {
  private readonly earthfilePath = path.normalize(
    `${__dirname}/assets/earthly`
  );
  private readonly earthlyExecutable =
    process.env['EARTHLY_EXECUTABLE'] || 'earthly';
  private readonly executorImage =
    process.env['EXECUTOR_IMAGE'] ||
    '../../../../../apps/executor+docker-image';

  private async executeEarthlyCommand(
    commandArgs: string[],
    earthlyArgs: EarthlyArgs,
    secrets: EarthlyArgs
  ): Promise<CommandOutput> {
    earthlyArgs['EXECUTOR_IMAGE'] = this.executorImage;
    const env: Record<string, string> = {
      ...earthlyArgs,
      ...secrets,
      EARTHLY_ALLOW_PRIVILEGED: 'true',
    };
    const argKeys = Object.keys(earthlyArgs);
    if (argKeys.length > 0) {
      env['EARTHLY_BUILD_ARGS'] = argKeys.join(',');
    }
    const secretKeys = Object.keys(secrets);
    if (secretKeys.length > 0) {
      env['EARTHLY_SECRETS'] = secretKeys.join(',');
    }
    return Utils.executeCommandWithResult(
      this.earthlyExecutable,
      commandArgs,
      env,
      this.earthfilePath
    );
  }

  async getResult(
    target: string,
    args: EarthlyArgs,
    secrets: EarthlyArgs
  ): Promise<EarthlyResult> {
    let tmpDir: string | undefined;
    try {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'executor-'));
      const { stderr, stdout, success } = await this.executeEarthlyCommand(
        ['--artifact', `+${target}/*`, `${tmpDir}/`],
        args,
        secrets
      );
      if (!success) {
        return {
          success,
          stderr,
          stdout,
          resultData: undefined,
        };
      }
      const content = await fs.readFile(path.join(tmpDir, 'result.json'));
      return {
        stderr,
        stdout,
        success,
        resultData: JSON.parse(content.toString()),
      };
    } finally {
      if (tmpDir) {
        await fs.remove(tmpDir);
      }
    }
  }
}
