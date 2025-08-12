import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { UserInfo } from '../interfaces/user-info.interface';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) { }

  async isAuthenticated(){
    try {
      // Verificar si existe el token y es válido
      if (!this.tokenService.isTokenValid()) {
        console.log('❌ Token inválido o expirado');
        return false;
      }

      // Verificar que el token sea válido haciendo una petición al backend
      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/auth/me`, {
          withCredentials: true,
        })
      );
      return true;
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      // Si hay error, limpiar el token inválido
      this.clearToken();
      return false;
    }
  }

  getUserInfo(): Observable<UserInfo> {
    // Verificar token antes de hacer la petición
    if (!this.tokenService.isTokenValid()) {
      console.log('❌ Token inválido, redirigiendo al login...');
      this.router.navigate(['/login']);
      return throwError(() => new Error('Token inválido'));
    }

    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`, { 
      withCredentials: true 
    });
  }

  // Método para limpiar el token al hacer logout
  clearToken() {
    this.tokenService.clearToken();
    console.log('✅ Token eliminado del sistema');
  }

  // Método para obtener información del token actual
  getTokenInfo() {
    const token = this.tokenService.getValidToken();
    if (token) {
      const payload = this.tokenService.getTokenPayload(token);
      const timeRemaining = this.tokenService.getTokenTimeRemaining(token);
      
      return {
        payload,
        timeRemaining,
        expiresIn: `${timeRemaining} minutos`
      };
    }
    return null;
  }

  // Método para verificar si el token está próximo a expirar
  isTokenExpiringSoon(): boolean {
    const token = this.tokenService.getValidToken();
    if (token) {
      const timeRemaining = this.tokenService.getTokenTimeRemaining(token);
      return timeRemaining < 5; // 5 minutos
    }
    return false;
  }
}
