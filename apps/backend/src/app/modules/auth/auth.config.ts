import { Injectable, Logger } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';
import { z } from 'zod';

import { getTypedConfig } from '../../utils/config';

const AuthEnvSchema = z.object({
  ADMIN_TOKEN: z.string().min(1),
});
const AuthConfigSchema = AuthEnvSchema.transform((env) => ({
  adminToken: env.ADMIN_TOKEN,
}));

@Injectable()
export class AuthConfigService {
  static load = registerAs(
    AuthConfigService.name,
    (): z.infer<typeof AuthEnvSchema> => {
      Logger.debug('Loading config', AuthConfigService.name);
      return {
        ADMIN_TOKEN: process.env['ADMIN_TOKEN'] || '',
      };
    }
  );

  private readonly logger = new Logger(AuthConfigService.name);

  constructor(private readonly config: ConfigService) {}

  get() {
    this.logger.debug('Config requested');
    return getTypedConfig(
      this.config,
      AuthConfigService.name,
      AuthConfigSchema
    );
  }
}
