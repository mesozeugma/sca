import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { z } from 'zod';

const TokenSchema = z.string();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TRPCContext = ({ req, res }: CreateExpressContextOptions) => {
  let token = 'none';

  const parseToken = TokenSchema.safeParse(req.headers['x-auth-token']);
  if (parseToken.success) {
    token = parseToken.data;
  }

  return { token };
};
export type Context = inferAsyncReturnType<typeof TRPCContext>;
