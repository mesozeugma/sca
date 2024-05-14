import { BuiltinAnalyzer } from './builtin-analyzer';

test('BuiltinAnalyzer', async () => {
  const analyzer = new BuiltinAnalyzer();
  const result = await analyzer.readRepo(
    './libs/executor-lib/code-samples/java/'
  );
  expect(result).toMatchSnapshot();
});
