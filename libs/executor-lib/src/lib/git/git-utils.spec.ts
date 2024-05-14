import { GitUtils } from './git-utils';
import { LocalGit } from './local-git';

describe('GitUtils', () => {
  const gitUtils = new GitUtils();

  test('getYearlyCommits', async () => {
    const git = new LocalGit('./libs/executor-lib/code-samples/dissect-cf/');
    const commits = await git.getHistory();
    const result = gitUtils.getYearlyCommits(commits, 5);
    expect(result).toMatchSnapshot();
  });
});
