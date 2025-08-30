// services/usuario.service.ts - Servicio para gestión de usuarios
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout, retry, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  Usuario,
  UsuarioResponse,
  UsuariosListResponse,
  EstadisticasUsuariosResponse,
  CreateUsuarioDto,
  CambiarPasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UsuarioFilters
} from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo usuario
   */
  crearUsuario(usuario: CreateUsuarioDto): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/usuarios`, usuario);
  }

  /**
   * Listar usuarios con filtros
   */
  listarUsuarios(filters: UsuarioFilters = {}): Observable<UsuariosListResponse> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.rol) params = params.set('rol', filters.rol);
    if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());

    return this.http.get<UsuariosListResponse>(`${this.apiUrl}/usuarios`, { params });
  }

  /**
   * Obtener estadísticas de usuarios
   */
  obtenerEstadisticas(): Observable<EstadisticasUsuariosResponse> {
    return this.http.get<EstadisticasUsuariosResponse>(`${this.apiUrl}/usuarios/estadisticas`);
  }

  /**
   * Obtener usuario por ID
   */
  obtenerUsuarioPorId(id: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios/${id}`);
  }

  /**
   * Actualizar usuario
   */
  actualizarUsuario(id: string, datos: Partial<Usuario>): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.apiUrl}/usuarios/${id}`, datos);
  }

  /**
   * Eliminar usuario (soft delete)
   */
  eliminarUsuario(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/usuarios/${id}`);
  }

  /**
   * Cambiar contraseña
   */
  cambiarPassword(id: string, passwordData: CambiarPasswordDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/usuarios/${id}/cambiar-password`, passwordData);
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  forgotPassword(emailData: ForgotPasswordDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/usuarios/forgot-password`, emailData);
  }

  /**
   * Restablecer contraseña
   */
  resetPassword(resetData: ResetPasswordDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/usuarios/reset-password`, resetData);
  }

  /**
   * Subir foto de perfil
   */
  subirFotoPerfil(id: string, archivo: File): Observable<UsuarioResponse> {
    const formData = new FormData();
    formData.append('file', archivo);
    
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/usuarios/${id}/foto`, formData, {
      headers: {
        'Accept': 'application/json'
      },
      reportProgress: false
    })
      .pipe(
        timeout(30000),
        retry(2),
        catchError((error: any) => {
          throw error;
        })
      );
  }

  /**
   * Obtener URL de foto de perfil del backend
   */
  obtenerUrlFotoPerfil(id: string): Observable<{ success: boolean; message: string; data: { foto_url: string } }> {
    return this.http.get<{ success: boolean; message: string; data: { foto_url: string } }>(`${this.apiUrl}/usuarios/${id}/foto`)
      .pipe(
        catchError((error: any) => {
          throw error;
        })
      );
  }

  /**
   * Obtener foto de perfil completa (URL + validación)
   */
  obtenerFotoPerfilCompleta(id: string): Observable<string> {
    return this.obtenerUrlFotoPerfil(id).pipe(
      map(response => {
        if (response.success && response.data?.foto_url) {
          return response.data.foto_url;
        }
        return '';
      }),
      catchError(() => of(''))
    );
  }

  /**
   * Obtener foto de perfil como Blob (método anterior - mantener por compatibilidad)
   */
  obtenerFotoPerfil(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/usuarios/${id}/foto`, { responseType: 'blob' })
      .pipe(
        catchError((error: any) => {
          throw error;
        })
      );
  }

  /**
   * Probar conectividad con el servidor
   */
  probarConectividad(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      timeout(10000),
      retry(1),
      catchError((error: any) => {
        throw error;
      })
    );
  }

  /**
   * Eliminar foto de perfil
   */
  eliminarFotoPerfil(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/usuarios/${id}/foto`);
  }
}