import { SemanticAnalyzer } from './semantic-analyzer';

test('SemanticAnalyzer', async () => {
  const analyzer = new SemanticAnalyzer();
  const result = await analyzer.readRepo(
    './libs/executor-lib/code-samples/java/'
  );
  expect(result).toMatchSnapshot();
});
