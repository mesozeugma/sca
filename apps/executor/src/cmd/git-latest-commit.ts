import { LocalGit, Utils } from '@sca/executor-lib';
import * as fs from 'fs-extra';

export async function main(args: string[]) {
  const repositoryPath = args[0];
  const git = new LocalGit(repositoryPath);
  const commitInfo = await git.getLatestCommit();
  await fs.writeFile('result.json', JSON.stringify(commitInfo));
}

if (require.main === module) {
  void main(Utils.getArgs());
}
