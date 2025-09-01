import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { 
  Director, 
  CreateDirectorDto, 
  UpdateDirectorDto, 
  DirectorResponse, 
  DirectorListResponse,
  AsignarUsuarioDto,
  CambiarUsuarioDto,
  AsignarUsuarioResponse,
  UsuarioDisponible,
  UsuariosDisponiblesResponse
} from '../interfaces/director.interface';

@Injectable({
  providedIn: 'root'
})
export class DirectorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Crear un nuevo director
   */
  crearDirector(directorData: CreateDirectorDto): Observable<DirectorResponse> {
    return this.http.post<DirectorResponse>(`${this.apiUrl}/directores`, directorData);
  }

  /**
   * Listar todos los directores
   */
  listarDirectores(): Observable<DirectorListResponse> {
    return this.http.get<any>(`${this.apiUrl}/directores`).pipe(
      map(response => {
        // El backend devuelve {success, message, data: {directores: [...]}}
        // Necesitamos convertirlo a {success, message, data: [...]}
        if (response.success && response.data && response.data.directores) {
          return {
            success: response.success,
            message: response.message,
            data: response.data.directores
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener directores',
          data: []
        };
      })
    );
  }

  /**
   * Obtener director por ID
   */
  obtenerDirectorPorId(idDirector: string): Observable<DirectorResponse> {
    return this.http.get<DirectorResponse>(`${this.apiUrl}/directores/${idDirector}`);
  }

  /**
   * Actualizar director
   */
  actualizarDirector(idDirector: string, directorData: UpdateDirectorDto): Observable<DirectorResponse> {
    return this.http.patch<DirectorResponse>(`${this.apiUrl}/directores/${idDirector}`, directorData);
  }

  /**
   * Verificar si un director tiene usuarios asignados
   */
  verificarUsuariosAsignados(idDirector: string): Observable<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}> {
    return this.http.get<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}>(`${this.apiUrl}/directores/${idDirector}/usuarios`);
  }

  /**
   * Eliminar director
   */
  eliminarDirector(idDirector: string): Observable<DirectorResponse> {
    return this.http.delete<DirectorResponse>(`${this.apiUrl}/directores/${idDirector}`);
  }

  /**
   * Asignar usuario existente a director
   */
  asignarUsuario(datosAsignacion: AsignarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.post<AsignarUsuarioResponse>(`${this.apiUrl}/directores/asignar-usuario`, datosAsignacion);
  }

  /**
   * Cambiar usuario asignado a director
   */
  cambiarUsuario(idDirector: string, datosCambio: CambiarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.patch<AsignarUsuarioResponse>(`${this.apiUrl}/directores/${idDirector}/cambiar-usuario`, datosCambio);
  }

  /**
   * Obtener usuarios disponibles con rol DIRECTOR que no tengan director asignado
   */
  obtenerUsuariosDisponibles(): Observable<UsuariosDisponiblesResponse> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/disponibles?rol=DIRECTOR`).pipe(
      map(response => {
        // El backend devuelve {success, message, data: {usuarios: [...]}}
        // Necesitamos convertirlo a {success, message, data: [...]}
        if (response.success && response.data && response.data.usuarios) {
          return {
            success: response.success,
            message: response.message,
            data: response.data.usuarios
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener usuarios disponibles',
          data: []
        };
      })
    );
  }
}
