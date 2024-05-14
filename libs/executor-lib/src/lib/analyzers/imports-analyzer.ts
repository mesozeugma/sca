import { AnalysisOutput } from '../analysis/analysis-output';
import { OpensearchIndex } from '../opensearch/opensearch-index';
import { readRepo } from '../read-repo';

import { Analyzer } from './analyzer';

export class ImportsAnalyzer implements Analyzer {
  async readRepo(repositoryPath: string) {
    try {
      const repositoryItems = await readRepo(repositoryPath);
      const repositoryImportItems = repositoryItems.filter(
        (value) => value.type === 'import'
      );
      return repositoryItems
        .map((e) =>
          AnalysisOutput.create(OpensearchIndex.ANALYSIS_RESULT_REPOSITORIES, e)
        )
        .concat(
          repositoryImportItems.map((e) =>
            AnalysisOutput.create(
              OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORTS,
              e
            )
          )
        );
    } catch (e) {
      if (e instanceof Error) {
        return [
          AnalysisOutput.create(
            OpensearchIndex.ANALYSIS_RESULT_REPOSITORY_IMPORT_ERRORS,
            {
              errorMessage: e.message,
            }
          ),
        ];
      } else {
        throw e;
      }
    }
  }
}
