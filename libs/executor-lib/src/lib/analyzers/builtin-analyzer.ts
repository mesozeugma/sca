import { Analyzer } from './analyzer';
import { ImportsAnalyzer } from './imports-analyzer';
import { SccAnalyzer } from './scc-analyzer';
import { SemanticAnalyzer } from './semantic-analyzer';

/**
 * Bundle of analyzers that do not depend on an external service
 */
export class BuiltinAnalyzer implements Analyzer {
  private importsAnalyzer = new ImportsAnalyzer();
  private sccAnalyzer = new SccAnalyzer();
  private semanticAnalyzer = new SemanticAnalyzer();

  async readRepo(repositoryPath: string) {
    const result = await Promise.all([
      await this.importsAnalyzer.readRepo(repositoryPath),
      await this.sccAnalyzer.readRepo(repositoryPath),
      await this.semanticAnalyzer.readRepo(repositoryPath),
    ]);
    return result.flat();
  }
}
