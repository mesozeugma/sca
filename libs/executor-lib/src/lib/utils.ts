import { exec } from 'teen_process';
import { z } from 'zod';

export interface CommandOutput {
  readonly stderr: string;
  readonly stdout: string;
  readonly success: boolean;
}

export class Utils {
  static getArgs(): string[] {
    const args = process.argv;
    if (process.argv.length >= 3) {
      return args.slice(2);
    }
    return [];
  }

  static async executeCommand(
    command: string,
    args: string[],
    env: Record<string, string> = {},
    cwd?: string
  ): Promise<CommandOutput> {
    const { stdout, stderr } = await exec(command, args, {
      env: { ...process.env, ...env },
      cwd,
    });
    return {
      success: true,
      stderr,
      stdout,
    };
  }

  static async executeCommandWithResult(
    command: string,
    args: string[],
    env: Record<string, string> = {},
    cwd?: string
  ): Promise<CommandOutput> {
    try {
      return await this.executeCommand(command, args, env, cwd);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return {
        success: false,
        stderr: typeof e.stderr === 'string' ? e.stderr : '',
        stdout: typeof e.stdout === 'string' ? e.stdout : '',
      };
    }
  }

  static requireEnv(key: string) {
    const value = process.env[key];
    if (value) {
      return value;
    }
    throw Error(`Environmental variable ${key} is not set`);
  }

  static getConfig() {
    const envValue = this.requireEnv('EXECUTOR_CONFIG');
    return z.object({}).passthrough().parse(JSON.parse(envValue));
  }
}
