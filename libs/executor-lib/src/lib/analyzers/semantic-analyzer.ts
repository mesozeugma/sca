import klaw from 'klaw';
import path from 'node:path';
import { z } from 'zod';

import { AnalysisOutput } from '../analysis/analysis-output';
import { OpensearchIndex } from '../opensearch/opensearch-index';
import { Utils } from '../utils';

import { Analyzer } from './analyzer';

const SemanticSymbol = z.object({}).passthrough();
const SemanticJSONSymbols = z
  .object({
    files: z.array(
      z
        .object({
          symbols: z.array(SemanticSymbol).default([]),
        })
        .strip()
    ),
  })
  .strip();

const SemanticResult = z
  .object({
    file: z.string(),
    symbol: SemanticSymbol,
  })
  .strict();
type SemanticResult = z.infer<typeof SemanticResult>;

export class SemanticAnalyzer implements Analyzer {
  private filterPath(file: string) {
    const fileExtension = path.extname(file);
    return ['.java', '.py'].some((validExtension) =>
      fileExtension.endsWith(validExtension)
    );
  }

  private async seamntic(repositoryPath: string): Promise<SemanticResult[]> {
    if (!repositoryPath) {
      throw Error('Repository path not set');
    }
    const result: SemanticResult[] = [];
    for await (const file of klaw(repositoryPath, {
      depthLimit: -1,
    })) {
      if (!this.filterPath(file.path)) continue;

      const { stdout } = await Utils.executeCommand('semantic', [
        'parse',
        '--json-symbols',
        file.path,
      ]);
      const jsonSymbols = await SemanticJSONSymbols.parseAsync(
        JSON.parse(stdout)
      );
      if (jsonSymbols.files.length === 0) continue;
      jsonSymbols.files[0].symbols.forEach((element) => {
        result.push({
          file: path.relative(repositoryPath, file.path),
          symbol: element,
        });
      });
    }

    return result;
  }

  async readRepo(repositoryPath: string) {
    const items = await this.seamntic(repositoryPath);
    return items.map((e) =>
      AnalysisOutput.create(OpensearchIndex.ANALYSIS_RESULT_SEMANTIC, e)
    );
  }
}
