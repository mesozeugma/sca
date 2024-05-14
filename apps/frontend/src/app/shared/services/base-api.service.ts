import { Injectable } from '@angular/core';
import type { AppRouter } from '@sca/trpc-api';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  readonly client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api',
        headers: () => {
          return {
            'X-Auth-Token': this.tokenService.getToken(),
          };
        },
      }),
    ],
  });

  constructor(private readonly tokenService: TokenService) {}
}
