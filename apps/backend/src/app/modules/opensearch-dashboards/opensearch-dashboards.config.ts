import { Injectable, Logger } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';
import { z } from 'zod';

import { getTypedConfig } from '../../utils/config';

const OpensearchDashboardsEnvSchema = z.object({
  OPENSEARCH_DASHBOARDS_BASE_URL: z.string().min(1),
  OPENSEARCH_DASHBOARDS_USERNAME: z.string().min(1),
  OPENSEARCH_DASHBOARDS_TENANT: z.string().min(1),
});
const OpensearchDashboardsConfigSchema =
  OpensearchDashboardsEnvSchema.transform((env) => ({
    baseUrl: env.OPENSEARCH_DASHBOARDS_BASE_URL,
    username: env.OPENSEARCH_DASHBOARDS_USERNAME,
    tenant: env.OPENSEARCH_DASHBOARDS_TENANT,
  }));

@Injectable()
export class OpensearchDashboardsConfigService {
  static load = registerAs(
    OpensearchDashboardsConfigService.name,
    (): z.infer<typeof OpensearchDashboardsEnvSchema> => {
      Logger.debug('Loading config', OpensearchDashboardsConfigService.name);
      return {
        OPENSEARCH_DASHBOARDS_BASE_URL:
          process.env['OPENSEARCH_DASHBOARDS_BASE_URL'] || '',
        OPENSEARCH_DASHBOARDS_USERNAME:
          process.env['OPENSEARCH_DASHBOARDS_USERNAME'] || 'admin',
        OPENSEARCH_DASHBOARDS_TENANT:
          process.env['OPENSEARCH_DASHBOARDS_TENANT'] || 'global',
      };
    }
  );

  private readonly logger = new Logger(OpensearchDashboardsConfigService.name);

  constructor(private readonly config: ConfigService) {}

  get() {
    this.logger.debug('Config requested');
    return getTypedConfig(
      this.config,
      OpensearchDashboardsConfigService.name,
      OpensearchDashboardsConfigSchema
    );
  }
}
