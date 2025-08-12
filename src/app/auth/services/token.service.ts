import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  constructor(
    private router: Router,
    private cookieService: CookieService
  ) { }

  /**
   * Verifica si un token JWT ha expirado
   */
  isTokenExpired(token: string): boolean {
    try {
      // Decodificar el token JWT (solo la parte del payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si ha expirado
      const currentTime = Date.now() / 1000;
      const expirationTime = payload.exp;
      
      // Si no hay exp, considerar como expirado por seguridad
      if (!expirationTime) {
        console.log('⚠️ Token no tiene tiempo de expiración, considerando como expirado');
        return true;
      }
      
      // Verificar si está próximo a expirar (5 minutos antes)
      const timeUntilExpiry = expirationTime - currentTime;
      const isExpiringSoon = timeUntilExpiry < 300; // 5 minutos
      
      if (isExpiringSoon) {
        console.log('⚠️ Token expira en:', Math.floor(timeUntilExpiry / 60), 'minutos');
      }
      
      return currentTime >= expirationTime;
    } catch (error) {
      console.error('❌ Error al validar token:', error);
      return true; // Por seguridad, considerar como expirado si hay error
    }
  }

  /**
   * Verifica si el token actual es válido
   */
  isTokenValid(): boolean {
    const token = this.getStoredToken();
    
    if (!token) {
      return false;
    }
    
    if (this.isTokenExpired(token)) {
      console.log('❌ Token expirado, limpiando...');
      this.clearToken();
      return false;
    }
    
    return true;
  }

  /**
   * Obtiene el token si es válido, sino redirige al login
   */
  getValidToken(): string | null {
    if (!this.isTokenValid()) {
      console.log('❌ Token inválido, redirigiendo al login...');
      this.clearToken();
      this.router.navigate(['/login']);
      return null;
    }
    
    return this.getStoredToken();
  }

  /**
   * Obtiene el token almacenado (desde cookies o sessionStorage como fallback)
   */
  private getStoredToken(): string | null {
    // Intentar obtener de cookies primero (más seguro)
    let token = this.cookieService.getCookie(this.TOKEN_KEY);
    
    // Si no hay en cookies, intentar sessionStorage como fallback
    if (!token) {
      token = sessionStorage.getItem(this.TOKEN_KEY);
    }
    
    return token;
  }

  /**
   * Almacena el token (preparado para httpOnly cookies del backend)
   */
  storeToken(token: string): void {
    // NOTA: Para httpOnly cookies, el backend debe establecerlas
    // Por ahora, usamos sessionStorage como fallback
    sessionStorage.setItem(this.TOKEN_KEY, token);
    console.log('✅ Token almacenado (preparado para httpOnly cookies)');
    console.log('ℹ️ Para máxima seguridad, el backend debe establecer cookies httpOnly');
  }

  /**
   * Limpia el token
   */
  clearToken(): void {
    // Limpiar de cookies
    this.cookieService.deleteCookie(this.TOKEN_KEY);
    // Limpiar de sessionStorage como fallback
    sessionStorage.removeItem(this.TOKEN_KEY);
    console.log('✅ Token eliminado del sistema');
  }

  /**
   * Obtiene información del token (payload)
   */
  getTokenPayload(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Obtiene el tiempo restante del token en minutos
   */
  getTokenTimeRemaining(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const expirationTime = payload.exp;
      
      if (!expirationTime) {
        return 0;
      }
      
      const timeRemaining = expirationTime - currentTime;
      return Math.max(0, Math.floor(timeRemaining / 60));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Verifica si el sistema está usando cookies httpOnly
   */
  isUsingHttpOnlyCookies(): boolean {
    // Si hay token en cookies pero no en sessionStorage, probablemente son httpOnly
    const cookieToken = this.cookieService.getCookie(this.TOKEN_KEY);
    const storageToken = sessionStorage.getItem(this.TOKEN_KEY);
    
    return !!(cookieToken && !storageToken);
  }

  /**
   * Obtiene información del estado de almacenamiento
   */
  getStorageInfo(): any {
    return {
      hasCookieToken: !!this.cookieService.getCookie(this.TOKEN_KEY),
      hasStorageToken: !!sessionStorage.getItem(this.TOKEN_KEY),
      isUsingHttpOnly: this.isUsingHttpOnlyCookies(),
      tokenValid: this.isTokenValid()
    };
  }
}
