import { SccAnalyzer } from './scc-analyzer';

test('SccAnalyzer', async () => {
  const analyzer = new SccAnalyzer();
  const result = await analyzer.readRepo(
    './libs/executor-lib/code-samples/java/'
  );
  expect(result).toMatchSnapshot();
});
