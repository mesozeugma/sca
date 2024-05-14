import { Injectable, Logger } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';
import { z } from 'zod';

import { getTypedConfig } from '../../utils/config';

const OpensearchEnvSchema = z.object({
  OPENSEARCH_URL: z.string().min(1),
});
const OpensearchConfigSchema = OpensearchEnvSchema.transform((env) => ({
  baseUrl: env.OPENSEARCH_URL,
}));

@Injectable()
export class OpensearchConfigService {
  static load = registerAs(
    OpensearchConfigService.name,
    (): z.infer<typeof OpensearchEnvSchema> => {
      Logger.debug('Loading config', OpensearchConfigService.name);
      return {
        OPENSEARCH_URL: process.env['OPENSEARCH_URL'] || '',
      };
    }
  );

  private readonly logger = new Logger(OpensearchConfigService.name);

  constructor(private readonly config: ConfigService) {}

  get() {
    this.logger.debug('Config requested');
    return getTypedConfig(
      this.config,
      OpensearchConfigService.name,
      OpensearchConfigSchema
    );
  }
}
