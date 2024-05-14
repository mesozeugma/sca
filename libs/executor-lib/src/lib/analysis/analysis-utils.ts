import fs from 'fs-extra';

import { AnalysisOutput } from './analysis-output';

export class AnalysisUtils {
  async export(filePath: string, items: AnalysisOutput[]) {
    const content = items.map((e) => ({ index: e.index, data: e.data }));
    await fs.writeFile(filePath, JSON.stringify(content));
  }
}
