import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { 
  Auxiliar, 
  CreateAuxiliarDto, 
  UpdateAuxiliarDto, 
  AuxiliarResponse, 
  AuxiliarListResponse,
  AsignarUsuarioDto,
  CambiarUsuarioDto,
  AsignarUsuarioResponse,
  UsuarioDisponible,
  UsuariosDisponiblesResponse
} from '../interfaces/auxiliar.interface';

@Injectable({
  providedIn: 'root'
})
export class AuxiliarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Crear un nuevo auxiliar
   */
  crearAuxiliar(auxiliarData: CreateAuxiliarDto): Observable<AuxiliarResponse> {
    return this.http.post<AuxiliarResponse>(`${this.apiUrl}/auxiliares`, auxiliarData);
  }

  /**
   * Listar todos los auxiliares
   */
  listarAuxiliares(): Observable<AuxiliarListResponse> {
    return this.http.get<any>(`${this.apiUrl}/auxiliares`).pipe(
      map(response => {
        // El backend devuelve {success, message, data: {auxiliares: [...]}}
        // Necesitamos convertirlo a {success, message, data: [...]}
        if (response.success && response.data && response.data.auxiliares) {
          return {
            success: response.success,
            message: response.message,
            data: response.data.auxiliares
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener auxiliares',
          data: []
        };
      })
    );
  }

  /**
   * Obtener auxiliar por ID
   */
  obtenerAuxiliarPorId(idAuxiliar: string): Observable<AuxiliarResponse> {
    return this.http.get<AuxiliarResponse>(`${this.apiUrl}/auxiliares/${idAuxiliar}`);
  }

  /**
   * Actualizar auxiliar
   */
  actualizarAuxiliar(idAuxiliar: string, auxiliarData: UpdateAuxiliarDto): Observable<AuxiliarResponse> {
    return this.http.patch<AuxiliarResponse>(`${this.apiUrl}/auxiliares/${idAuxiliar}`, auxiliarData);
  }

  /**
   * Verificar si un auxiliar tiene usuarios asignados
   */
  verificarUsuariosAsignados(idAuxiliar: string): Observable<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}> {
    return this.http.get<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}>(`${this.apiUrl}/auxiliares/${idAuxiliar}/usuarios`);
  }

  /**
   * Eliminar auxiliar
   */
  eliminarAuxiliar(idAuxiliar: string): Observable<AuxiliarResponse> {
    return this.http.delete<AuxiliarResponse>(`${this.apiUrl}/auxiliares/${idAuxiliar}`);
  }

  /**
   * Asignar usuario existente a auxiliar
   */
  asignarUsuario(datosAsignacion: AsignarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.post<AsignarUsuarioResponse>(`${this.apiUrl}/auxiliares/asignar-usuario`, datosAsignacion);
  }

  /**
   * Cambiar usuario asignado a auxiliar
   */
  cambiarUsuario(idAuxiliar: string, datosCambio: CambiarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.patch<AsignarUsuarioResponse>(`${this.apiUrl}/auxiliares/${idAuxiliar}/cambiar-usuario`, datosCambio);
  }

  /**
   * Obtener usuarios disponibles con rol AUXILIAR que no tengan auxiliar asignado
   */
  obtenerUsuariosDisponibles(): Observable<UsuariosDisponiblesResponse> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/disponibles?rol=AUXILIAR`).pipe(
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
