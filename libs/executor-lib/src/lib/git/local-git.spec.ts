import { LocalGit } from './local-git';

describe('LocalGit', () => {
  test('getHistory', async () => {
    const git = new LocalGit('./libs/executor-lib/code-samples/dissect-cf/');
    const result = await git.getHistory();
    expect(result).toMatchSnapshot();
  });

  test('getLatestCommit', async () => {
    const git = new LocalGit('./libs/executor-lib/code-samples/dissect-cf/');
    const result = await git.getLatestCommit();
    expect(result).toMatchSnapshot();
  });
});
