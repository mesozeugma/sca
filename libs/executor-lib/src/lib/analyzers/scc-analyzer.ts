import { z } from 'zod';

import { AnalysisOutput } from '../analysis/analysis-output';
import { OpensearchIndex } from '../opensearch/opensearch-index';
import { Utils } from '../utils';

import { Analyzer } from './analyzer';

const LineCountStat = z
  .object({
    Name: z.string().toLowerCase(),
    Blank: z.number().int(),
    Code: z.number().int(),
    Comment: z.number().int(),
    Count: z.number().int(),
    Lines: z.number().int(),
  })
  .strip()
  .transform((stat) => ({
    language: stat.Name,
    blankLineCount: stat.Blank,
    commentRatio: stat.Comment / (stat.Comment + stat.Code),
    codeLineCount: stat.Code,
    commentLineCount: stat.Comment,
    fileCount: stat.Count,
    lineCount: stat.Lines,
  }));
type LineCountStat = z.infer<typeof LineCountStat>;
const sccOutput = z.array(LineCountStat);

export class SccAnalyzer implements Analyzer {
  private async scc(repositoryPath: string): Promise<LineCountStat> {
    if (!repositoryPath) {
      throw Error('Repository path not set');
    }

    const { stdout } = await Utils.executeCommand('scc', [
      '--format=json',
      '--sort=code',
      repositoryPath,
    ]);
    const parseResult = await sccOutput.parseAsync(JSON.parse(stdout));
    const primaryLanguageStat = parseResult.find(({ language }) =>
      ['java', 'python'].includes(language)
    );
    if (primaryLanguageStat !== undefined) {
      return primaryLanguageStat;
    }
    throw new Error('No countable languages in repository');
  }

  async readRepo(repositoryPath: string) {
    const result = await this.scc(repositoryPath);
    return [
      new AnalysisOutput(
        OpensearchIndex.ANALYSIS_RESULT_PRIMARY_LINE_COUNTS,
        result
      ),
    ];
  }
}
