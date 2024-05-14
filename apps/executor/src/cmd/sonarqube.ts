import {
  AnalysisOutput,
  AnalysisUtils,
  OpensearchIndex,
  SonarQubeClient,
  SonarQubeIssues,
  SonarQubeMetrics,
  Utils,
} from '@sca/executor-lib';

async function main(args: string[]) {
  const repositoryKey = args[0];

  const sonarQubeClient = new SonarQubeClient(
    Utils.requireEnv('SONARQUBE_URL'),
    Utils.requireEnv('SONARQUBE_TOKEN')
  );

  const sonarQubeIssues = new SonarQubeIssues(sonarQubeClient);
  const issues = await sonarQubeIssues.getIssues(repositoryKey);
  const issueItems = issues.map((e) =>
    AnalysisOutput.create(OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_ISSUES, e)
  );

  const sonarQubeMetrics = new SonarQubeMetrics(sonarQubeClient);
  const metrics = await sonarQubeMetrics.getMetrics(repositoryKey);
  const metricItems = metrics.map((e) =>
    AnalysisOutput.create(OpensearchIndex.ANALYSIS_RESULT_SONARQUBE_METRICS, e)
  );

  const analysisUtils = new AnalysisUtils();
  await analysisUtils.export('result.json', [...issueItems, ...metricItems]);
}

if (require.main === module) {
  void main(Utils.getArgs());
}
