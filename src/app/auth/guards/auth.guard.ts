import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async() => {
  
  const router:Router = inject(Router);
  const authService: AuthService = inject(AuthService);

  const isAuth = await authService.isAuthenticated();

  if(!isAuth){
    router.navigate(['/login']);
    return false;
  }

  return true;
}
  

