import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    console.log('🛡️ AuthGuard: Verificando acceso a ruta protegida');
    
    // Verificar si el token es válido
    const isTokenValid = this.tokenService.isTokenValid();
    console.log('🎫 Token válido:', isTokenValid);
    
    if (!isTokenValid) {
      console.log('❌ AuthGuard: Token inválido, redirigiendo a login');
      this.authService.clearToken();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el token está próximo a expirar
    const token = this.tokenService.getValidToken();
    console.log('🔍 Token obtenido del TokenService:', !!token);
    
    if (token && this.tokenService.isTokenExpired(token)) {
      console.log('⏰ AuthGuard: Token expirado, redirigiendo a login');
      this.authService.clearToken();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el token está próximo a expirar (advertencia)
    if (token) {
      const timeRemaining = this.tokenService.getTokenTimeRemaining(token);
      console.log('⏰ Tiempo restante del token:', timeRemaining, 'minutos');
      if (timeRemaining < 5) {
        console.warn('⚠️ Token próximo a expirar');
        // Aquí podrías implementar renovación automática
      }
    }

    console.log('✅ AuthGuard: Acceso permitido');
    return true;
  }
}
  

