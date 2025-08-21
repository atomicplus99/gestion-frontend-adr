import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { UserInfo } from '../interfaces/user-info.interface';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) { }

  async isAuthenticated(): Promise<boolean> {
    console.log('🔍 [AUTH] Verificando autenticación...');
    try {
      if (!this.tokenService.isTokenValid()) {
        console.log('❌ [AUTH] Token no válido o expirado');
        return false;
      }
      console.log('✅ [AUTH] Token válido, verificando con backend...');

      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/auth/me`)
      );
      console.log('✅ [AUTH] Sesión verificada exitosamente con backend');
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Error al verificar autenticación:', error);
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as any;
        if (httpError.status === 401) {
          console.log('🚫 [AUTH] Error 401 - Token inválido, limpiando...');
          this.clearToken();
        }
      }
      return false;
    }
  }

  getUserInfo(): Observable<UserInfo> {
    const token = this.tokenService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`, { headers });
  }

  clearToken() {
    console.log('🧹 [AUTH] Limpiando token...');
    this.tokenService.clearToken();
    console.log('✅ [AUTH] Token limpiado');
  }
}