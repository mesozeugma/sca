import { GitLog } from './interfaces/git-log';

export class GitUtils {
  getYearlyCommits(commits: GitLog[], years: number): GitLog[] {
    const result: GitLog[] = [];
    const existingYears: number[] = [];
    for (const commit of commits) {
      const commitYear = commit.createdAt.getFullYear();
      if (!existingYears.includes(commitYear)) {
        result.push(commit);
        existingYears.push(commitYear);
      }
      if (existingYears.length === years) {
        return result;
      }
    }
    return result;
  }
}
