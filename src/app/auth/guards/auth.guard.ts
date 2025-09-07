import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserStoreService } from '../store/user.store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userStore = inject(UserStoreService);

  canActivate(): Observable<boolean> {
    // Primero verificar si ya hay usuario en el store
    if (this.userStore.isAuthenticated()) {
      return from(Promise.resolve(true));
    }
    
    // Si no hay usuario en store, verificar autenticación
    return from(this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    }));
  }
}
  

