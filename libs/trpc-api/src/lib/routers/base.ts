import { Context } from '../context';
import { UnauthorizedTRPCError } from '../errors/unauthorized.error';
import { IAuthService } from '../services/auth.service';

export class BaseRouter {
  constructor(private readonly auth: IAuthService) {}

  protected async requireAdmin(ctx: Context) {
    const isAdmin = await this.auth.isAdmin(ctx);
    if (!isAdmin) {
      throw new UnauthorizedTRPCError();
    }
  }
}
