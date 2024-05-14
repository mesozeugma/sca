import { TRPCError } from '@trpc/server';

export class UnauthorizedTRPCError extends TRPCError {
  constructor(params: { message?: string; cause?: unknown } = {}) {
    super({
      code: 'UNAUTHORIZED',
      message: params.message,
      cause: params.cause,
    });
  }
}
