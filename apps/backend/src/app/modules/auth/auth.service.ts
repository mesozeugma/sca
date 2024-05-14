import { Injectable } from '@nestjs/common';
import { Context, IAuthService } from '@sca/trpc-api';

import { AuthConfigService } from './auth.config';

@Injectable()
export class AuthService implements IAuthService {
  private readonly adminToken: string;

  constructor(config: AuthConfigService) {
    this.adminToken = config.get().adminToken;
  }

  async isAdmin(ctx: Context): Promise<boolean> {
    return ctx.token === this.adminToken;
  }
}
