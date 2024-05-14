import { ImportsAnalyzer } from './imports-analyzer';

test('ImportsAnalyzer', async () => {
  const analyzer = new ImportsAnalyzer();
  const result = await analyzer.readRepo(
    './libs/executor-lib/code-samples/java/'
  );
  expect(result).toMatchSnapshot();
});
