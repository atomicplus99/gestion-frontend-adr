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
    console.log('🛡️ [AUTHGUARD] Verificando acceso a ruta protegida...');
    
    // Primero verificar si ya hay usuario en el store
    if (this.userStore.isAuthenticated()) {
      console.log('✅ [AUTHGUARD] Usuario ya autenticado en store, permitiendo acceso');
      return from(Promise.resolve(true));
    }
    
    // Si no hay usuario en store, verificar autenticación
    return from(this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        console.log('✅ [AUTHGUARD] Usuario autenticado, permitiendo acceso');
        return true;
      } else {
        console.log('❌ [AUTHGUARD] Usuario no autenticado, redirigiendo a login...');
        this.router.navigate(['/login']);
        return false;
      }
    }));
  }
}
  

