import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UsuariosCompletosResponse, FiltrosUsuarios } from '../interfaces/usuario-completo.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosCompletosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Actualizar usuario por ID
   */
  actualizarUsuario(idUser: string, datos: any): Observable<{success: boolean, message: string, data: any}> {
    return this.http.patch<{success: boolean, message: string, data: any}>(`${this.apiUrl}/usuarios/${idUser}`, datos);
  }

  /**
   * Subir foto de perfil
   */
  subirFotoPerfil(idUser: string, archivo: File): Observable<{success: boolean, message: string, data: any}> {
    const formData = new FormData();
    formData.append('file', archivo);
    
    return this.http.post<{success: boolean, message: string, data: any}>(`${this.apiUrl}/usuarios/${idUser}/foto`, formData, {
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Obtener URL de foto de perfil
   */
  obtenerUrlFotoPerfil(idUser: string): Observable<{success: boolean, message: string, data: {foto_url: string}}> {
    return this.http.get<{success: boolean, message: string, data: {foto_url: string}}>(`${this.apiUrl}/usuarios/${idUser}/foto`);
  }

  /**
   * Eliminar usuario por ID
   */
  eliminarUsuario(idUser: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/usuarios/${idUser}`);
  }

  /**
   * Obtener usuarios completos con filtros y paginación
   */
  obtenerUsuariosCompletos(filtros: FiltrosUsuarios = {}): Observable<UsuariosCompletosResponse> {
    let params = new HttpParams();

    // Agregar filtros a los parámetros
    if (filtros.rol) {
      params = params.set('rol', filtros.rol);
    }
    
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    
    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    
    if (filtros.limit) {
      params = params.set('limit', filtros.limit.toString());
    }



    return this.http.get<UsuariosCompletosResponse>(`${this.apiUrl}/usuarios/completos`, { params });
  }

  /**
   * Obtener todos los usuarios sin filtros
   */
  obtenerTodosLosUsuarios(): Observable<UsuariosCompletosResponse> {
    return this.obtenerUsuariosCompletos();
  }

  /**
   * Obtener usuarios por rol
   */
  obtenerUsuariosPorRol(rol: 'ALUMNO' | 'AUXILIAR' | 'ADMINISTRADOR' | 'DIRECTOR'): Observable<UsuariosCompletosResponse> {
    return this.obtenerUsuariosCompletos({ rol });
  }

  /**
   * Buscar usuarios por texto
   */
  buscarUsuarios(search: string): Observable<UsuariosCompletosResponse> {
    return this.obtenerUsuariosCompletos({ search });
  }

  /**
   * Obtener usuarios activos
   */
  obtenerUsuariosActivos(): Observable<UsuariosCompletosResponse> {
    return this.obtenerUsuariosCompletos({ activo: true });
  }

  /**
   * Obtener usuarios inactivos
   */
  obtenerUsuariosInactivos(): Observable<UsuariosCompletosResponse> {
    return this.obtenerUsuariosCompletos({ activo: false });
  }
}