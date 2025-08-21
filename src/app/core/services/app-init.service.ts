import { Injectable, inject } from '@angular/core';
import { TokenService } from '../../auth/services/token.service';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  private readonly tokenService = inject(TokenService);

  async init(): Promise<void> {
    try {
      // Solo verificar si el token existe y es válido localmente
      const token = this.tokenService.getStoredToken();
      if (!token) {
        return;
      }
      
      // Verificar si el token ha expirado localmente
      if (this.tokenService.isTokenExpired(token)) {
        this.tokenService.clearToken();
        return;
      }
      
    } catch (err) {
      // Si hay algún error durante la inicialización, solo limpiar el token
      this.tokenService.clearToken();
    }
  }
}
