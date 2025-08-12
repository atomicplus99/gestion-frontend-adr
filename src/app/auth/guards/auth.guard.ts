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
    console.log('🔒 AuthGuard ejecutándose...');
    
    // Verificar si el token es válido
    if (!this.tokenService.isTokenValid()) {
      console.log('❌ Token inválido, redirigiendo al login...');
      this.authService.clearToken();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el token está próximo a expirar
    const token = localStorage.getItem('access_token');
    if (token && this.tokenService.isTokenExpired(token)) {
      console.log('❌ Token expirado, redirigiendo al login...');
      this.authService.clearToken();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el token está próximo a expirar (advertencia)
    if (token) {
      const timeRemaining = this.tokenService.getTokenTimeRemaining(token);
      if (timeRemaining < 5) {
        console.log('⚠️ Token expira en menos de 5 minutos');
        // Aquí podrías implementar renovación automática
      }
    }

    console.log('✅ Token válido, permitiendo acceso...');
    return true;
  }
}
  

