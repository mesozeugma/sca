import { LocalGit, Utils } from '@sca/executor-lib';
import * as fs from 'fs-extra';

export async function main(args: string[]) {
  const repositoryPath = args[0];
  const git = new LocalGit(repositoryPath);
  const items = await git.getHistory();
  await fs.writeFile('result.json', JSON.stringify(items));
}

if (require.main === module) {
  void main(Utils.getArgs());
}
