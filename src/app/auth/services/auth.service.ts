import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserInfo } from '../interfaces/user-info.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  private http = inject(HttpClient);

  async isAuthenticated(){
    try {
      // Verificar si existe el token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No hay token almacenado');
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
      console.error('Error en autenticación:', error);
      // Si hay error, limpiar el token inválido
      localStorage.removeItem('access_token');
      return false;
    }
  }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`, { withCredentials: true });
  }

  async validarYObtenerUsuario(): Promise<UserInfo | null> {
    try {
      const estaAutenticado = await this.isAuthenticated();
      if (!estaAutenticado) {
        return null;
      }
      const usuario = await firstValueFrom(this.getUserInfo());
      // Agrega verificación de validación de usuario
      if (!usuario || !usuario.nombreCompleto) {
        console.warn('Se recuperó un objeto de usuario inválido:', usuario);
        return null;
      }
      return usuario;
    } catch (error) {
      console.error('Error al validar usuario:', error);
      return null;
    }
  }

  // Método para limpiar el token al hacer logout
  clearToken() {
    localStorage.removeItem('access_token');
    console.log('Token eliminado');
  }
}
