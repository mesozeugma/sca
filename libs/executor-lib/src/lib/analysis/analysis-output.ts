import { OpensearchIndex } from '../opensearch/opensearch-index';

export class AnalysisOutput {
  index: OpensearchIndex;
  data: { [key: string]: unknown };

  constructor(index: OpensearchIndex, data: { [key: string]: unknown }) {
    this.index = index;
    this.data = data;
  }

  static create(index: OpensearchIndex, data: unknown) {
    return new AnalysisOutput(index, JSON.parse(JSON.stringify(data)));
  }
}
