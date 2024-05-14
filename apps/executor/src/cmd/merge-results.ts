import { Utils } from '@sca/executor-lib';
import * as fs from 'fs-extra';
import { z } from 'zod';

export async function main(args: string[]) {
  const directoryPath = args[0];
  const output: unknown[] = [];

  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    const content: unknown = await fs.readJSON(`${directoryPath}/${file}`);
    output.push(...z.object({}).passthrough().array().parse(content));
  }

  await fs.writeFile('result.json', JSON.stringify(output));
}

if (require.main === module) {
  void main(Utils.getArgs());
}
