import { AnalysisOutput } from '../analysis/analysis-output';

export interface Analyzer {
  readRepo(repositoryPath: string): Promise<AnalysisOutput[]>;
}
