import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { TokenService } from './services/token.service';

export const canActivateGuest: CanActivateFn | CanActivateChildFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isLoggedIn()) {
    return true;
  } else {
    return router.createUrlTree(['/']);
  }
};

export const canActivateAdmin: CanActivateFn | CanActivateChildFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    return true;
  } else {
    return router.createUrlTree(['/login']);
  }
};
