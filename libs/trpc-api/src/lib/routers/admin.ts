import { z } from 'zod';

import { Z_EMPTY_OBJECT } from '../consts';
import { IAuthService } from '../services/auth.service';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

export class AdminRouter extends BaseRouter {
  readonly instance = router({
    whoAmI: publicProcedure
      .input(Z_EMPTY_OBJECT)
      .output(z.object({ isAdmin: z.boolean() }).strict())
      .query(async ({ ctx }) => {
        const isAdmin = await this.authService.isAdmin(ctx);

        return { isAdmin };
      }),
  });

  constructor(private readonly authService: IAuthService) {
    super(authService);
  }
}
