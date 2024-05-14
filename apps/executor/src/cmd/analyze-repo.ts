import { AnalysisUtils, BuiltinAnalyzer, Utils } from '@sca/executor-lib';

export async function main(args: string[]) {
  const src = args[0];
  const analyzer = new BuiltinAnalyzer();
  const items = await analyzer.readRepo(src);
  const analysisUtils = new AnalysisUtils();
  await analysisUtils.export('result.json', items);
}

if (require.main === module) {
  void main(Utils.getArgs());
}
