import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const redirectedGuard: CanActivateFn = async() => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuth = await authService.isAuthenticated();

  if (isAuth) {
    router.navigate(['/home']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
