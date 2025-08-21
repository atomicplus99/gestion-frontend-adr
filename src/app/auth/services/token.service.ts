import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  constructor(
    private router: Router
  ) { }

  /**
   * Verifica si un token JWT ha expirado
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.getTokenPayload(token);
      
      if (!payload || !payload.exp) {
        return true;
      }
      
      const currentTime = Date.now() / 1000;
      const expirationTime = payload.exp;
      
      return currentTime >= expirationTime;
      
    } catch (error) {
      return true;
    }
  }

  /**
   * Verifica si el token almacenado es válido
   */
  isTokenValid(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  /**
   * Obtiene el payload de un token JWT
   */
  getTokenPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcula el tiempo restante en minutos antes de que expire el token
   */
  getTokenTimeRemaining(token: string): number {
    try {
      const payload = this.getTokenPayload(token);
      
      if (!payload || !payload.exp) {
        return 0;
      }

      const currentTime = Date.now() / 1000;
      const expirationTime = payload.exp;
      const timeRemaining = (expirationTime - currentTime) / 60; // en minutos

      return Math.max(0, timeRemaining);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Obtiene el token almacenado de localStorage
   */
  getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene un token válido (alias para getStoredToken para compatibilidad)
   */
  getValidToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Almacena el token en localStorage
   */
  storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Almacena el refresh token en localStorage
   */
  storeRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Obtiene el refresh token almacenado
   */
  getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Elimina todos los tokens almacenados
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken(): any {
    const token = this.getStoredToken();
    if (token && this.isTokenValid()) {
      return this.getTokenPayload(token);
    }
    return null;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userInfo = this.getUserFromToken();
    return userInfo?.userRole === role || userInfo?.role === role;
  }

  /**
   * Obtiene el ID del usuario desde el token
   */
  getUserId(): string | null {
    const userInfo = this.getUserFromToken();
    return userInfo?.idUser || userInfo?.id || null;
  }

  /**
   * Navega al login y limpia tokens
   */
  redirectToLogin(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}