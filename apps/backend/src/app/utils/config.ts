import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

export class UninitializedConfigError extends Error {
  constructor(key: string) {
    super(`Config ${key} is not loaded`);
  }
}

export function getTypedConfig<S extends z.ZodType>(
  configService: ConfigService,
  key: string,
  schema: S
): z.infer<S> {
  const value = configService.get(key);
  if (value !== undefined) {
    return schema.parse(value);
  }
  throw new UninitializedConfigError(key);
}
