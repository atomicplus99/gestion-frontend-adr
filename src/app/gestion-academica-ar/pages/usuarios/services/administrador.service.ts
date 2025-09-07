import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { 
  Administrador, 
  CreateAdministradorDto, 
  UpdateAdministradorDto, 
  AdministradorResponse, 
  AdministradorListResponse,
  AsignarUsuarioDto,
  CambiarUsuarioDto,
  AsignarUsuarioResponse,
  UsuarioDisponible,
  UsuariosDisponiblesResponse
} from '../interfaces/administrador.interface';

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Crear un nuevo administrador
   */
  crearAdministrador(administradorData: CreateAdministradorDto): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(`${this.apiUrl}/administradores`, administradorData);
  }

  /**
   * Listar todos los administradores
   */
  listarAdministradores(): Observable<AdministradorListResponse> {
    return this.http.get<any>(`${this.apiUrl}/administradores`).pipe(
      map(response => {
        // El backend devuelve {success, message, data: {administradores: [...]}}
        // Necesitamos convertirlo a {success, message, data: [...]}
        if (response.success && response.data && response.data.administradores) {
          return {
            success: response.success,
            message: response.message,
            data: response.data.administradores
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener administradores',
          data: []
        };
      })
    );
  }

  /**
   * Obtener administrador por ID
   */
  obtenerAdministradorPorId(idAdministrador: string): Observable<AdministradorResponse> {
    return this.http.get<AdministradorResponse>(`${this.apiUrl}/administradores/${idAdministrador}`);
  }

  /**
   * Actualizar administrador
   */
  actualizarAdministrador(idAdministrador: string, administradorData: UpdateAdministradorDto): Observable<AdministradorResponse> {
    return this.http.patch<AdministradorResponse>(`${this.apiUrl}/administradores/${idAdministrador}`, administradorData);
  }

  /**
   * Verificar si un administrador tiene usuarios asignados
   */
  verificarUsuariosAsignados(idAdministrador: string): Observable<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}> {
    return this.http.get<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}>(`${this.apiUrl}/administradores/${idAdministrador}/usuarios`);
  }

  /**
   * Eliminar administrador
   */
  eliminarAdministrador(idAdministrador: string): Observable<AdministradorResponse> {
    return this.http.delete<AdministradorResponse>(`${this.apiUrl}/administradores/${idAdministrador}`);
  }

  /**
   * Asignar usuario existente a administrador
   */
  asignarUsuario(datosAsignacion: AsignarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.post<AsignarUsuarioResponse>(`${this.apiUrl}/administradores/asignar-usuario`, datosAsignacion);
  }

  /**
   * Cambiar usuario asignado a administrador
   */
  cambiarUsuario(idAdministrador: string, datosCambio: CambiarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.patch<AsignarUsuarioResponse>(`${this.apiUrl}/administradores/${idAdministrador}/cambiar-usuario`, datosCambio);
  }

  /**
   * Obtener usuarios disponibles con rol ADMINISTRADOR que no tengan administrador asignado
   */
  obtenerUsuariosDisponibles(): Observable<UsuariosDisponiblesResponse> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/disponibles?rol=ADMINISTRADOR`).pipe(
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
