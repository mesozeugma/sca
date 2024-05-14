import { z } from 'zod';

import { MetricKey } from './interfaces/metric-key';
import { SonarQubeClient } from './sonarqube-client';

const GetMetricsInput = z
  .object({
    repositoryKey: z.string(),
    metricKeys: z.nativeEnum(MetricKey).array().min(1).max(15),
  })
  .strict();

const GetMetricsOutput = z
  .object({
    component: z
      .object({
        measures: z
          .object({
            metric: z.nativeEnum(MetricKey),
            value: z.string(),
          })
          .strip()
          .array(),
      })
      .strip(),
  })
  .strip();

const SonarQubeMetric = z
  .object({
    metric: z
      .object({
        name: z.string(),
        value: z.coerce.number(),
      })
      .strict(),
  })
  .strict();

export class SonarQubeMetrics {
  constructor(private readonly client: SonarQubeClient) {}

  private async getBatch(input: z.input<typeof GetMetricsInput>) {
    const validatedInput = GetMetricsInput.parse(input);
    const response = await this.client.get('measures/component', {
      component: validatedInput.repositoryKey,
      metricKeys: validatedInput.metricKeys.join(','),
    });
    return GetMetricsOutput.parse(response).component.measures;
  }

  async getMetrics(
    repositoryKey: string
  ): Promise<z.infer<typeof SonarQubeMetric>[]> {
    const metricsBatch1 = await this.getBatch({
      repositoryKey,
      metricKeys: [
        MetricKey.BLOCKER_VIOLATIONS,
        MetricKey.BUGS,
        MetricKey.CLASSES,
        MetricKey.CODE_SMELLS,
        MetricKey.COGNITIVE_COMPLEXITY,
        MetricKey.COMMENT_LINES,
        MetricKey.COMMENT_LINES_DENSITY,
        MetricKey.CRITICAL_VIOLATIONS,
        MetricKey.CYCLOMATIC_COMPLEXITY,
        MetricKey.DIRECTORIES,
        MetricKey.DUPLICATED_BLOCKS,
        MetricKey.DUPLICATED_FILES,
        MetricKey.DUPLICATED_LINES,
        MetricKey.DUPLICATED_LINES_DENSITY,
        MetricKey.FILES,
      ],
    });

    const metricsBatch2 = await this.getBatch({
      repositoryKey,
      metricKeys: [
        MetricKey.FUNCTIONS,
        MetricKey.INFO_VIOLATIONS,
        MetricKey.MAJOR_VIOLATIONS,
        MetricKey.MINOR_VIOLATIONS,
        MetricKey.NCLOC,
        MetricKey.RELIABILITY_REMEDIATION_EFFORT,
        MetricKey.SECURITY_HOTSPOTS,
        MetricKey.SECURITY_REMEDIATION_EFFORT,
        MetricKey.SQALE_INDEX,
        MetricKey.STATEMENTS,
        MetricKey.VIOLATIONS,
        MetricKey.VULNERABILITIES,
      ],
    });

    return [...metricsBatch1, ...metricsBatch2].map((e) =>
      SonarQubeMetric.parse({
        metric: { name: e.metric, value: e.value },
      })
    );
  }
}
