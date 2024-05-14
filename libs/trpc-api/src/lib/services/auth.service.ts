import { Context } from '../context';

export interface IAuthService {
  isAdmin(ctx: Context): Promise<boolean>;
}
