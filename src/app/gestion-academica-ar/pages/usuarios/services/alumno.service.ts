import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { 
  Alumno, 
  CreateAlumnoDto, 
  UpdateAlumnoDto, 
  AlumnoResponse, 
  AlumnoListResponse,
  AsignarUsuarioDto,
  CambiarUsuarioDto,
  AsignarUsuarioResponse,
  UsuarioDisponible,
  UsuariosDisponiblesResponse
} from '../interfaces/alumno.interface';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Crear un nuevo alumno
   */
  crearAlumno(alumnoData: CreateAlumnoDto): Observable<AlumnoResponse> {
    return this.http.post<AlumnoResponse>(`${this.apiUrl}/alumnos/registrar`, alumnoData);
  }

  /**
   * Listar todos los alumnos
   */
  listarAlumnos(): Observable<AlumnoListResponse> {
    return this.http.get<any>(`${this.apiUrl}/alumnos`).pipe(
      map(response => {
        // El backend devuelve {success, message, data: [...]}
        if (response.success && response.data) {
          return {
            success: response.success,
            message: response.message,
            data: response.data
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener alumnos',
          data: []
        };
      })
    );
  }

  /**
   * Listar alumnos con paginación
   */
  listarAlumnosConPaginacion(page: number = 1, limit: number = 10, search?: string): Observable<AlumnoListResponse> {
    let url = `${this.apiUrl}/alumnos/list?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            success: response.success,
            message: response.message,
            data: response.data.alumnos || response.data
          };
        }
        return {
          success: response.success || false,
          message: response.message || 'Error al obtener alumnos',
          data: []
        };
      })
    );
  }

  /**
   * Obtener alumno por ID
   */
  obtenerAlumnoPorId(idAlumno: string): Observable<AlumnoResponse> {
    return this.http.get<AlumnoResponse>(`${this.apiUrl}/alumnos/${idAlumno}`);
  }

  /**
   * Obtener alumno por código
   */
  obtenerAlumnoPorCodigo(codigo: string): Observable<AlumnoResponse> {
    return this.http.get<AlumnoResponse>(`${this.apiUrl}/alumnos/codigo/${codigo}`);
  }

  /**
   * Actualizar alumno por código
   */
  actualizarAlumnoPorCodigo(codigo: string, alumnoData: UpdateAlumnoDto): Observable<AlumnoResponse> {
    return this.http.put<AlumnoResponse>(`${this.apiUrl}/alumnos/actualizar/${codigo}`, alumnoData);
  }

  /**
   * Verificar si un alumno tiene usuarios asignados
   */
  verificarUsuariosAsignados(idAlumno: string): Observable<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}> {
    return this.http.get<{success: boolean, data: {tieneUsuarios: boolean, usuarios?: any[]}}>(`${this.apiUrl}/alumnos/${idAlumno}/usuarios`);
  }

  /**
   * Eliminar alumno
   */
  eliminarAlumno(idAlumno: string): Observable<AlumnoResponse> {
    return this.http.delete<AlumnoResponse>(`${this.apiUrl}/alumnos/${idAlumno}`);
  }

  /**
   * Asignar usuario existente a alumno
   */
  asignarUsuario(datosAsignacion: AsignarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.post<AsignarUsuarioResponse>(`${this.apiUrl}/alumnos/asignar-usuario`, datosAsignacion);
  }

  /**
   * Cambiar usuario asignado a alumno
   */
  cambiarUsuario(idAlumno: string, datosCambio: CambiarUsuarioDto): Observable<AsignarUsuarioResponse> {
    return this.http.patch<AsignarUsuarioResponse>(`${this.apiUrl}/alumnos/${idAlumno}/cambiar-usuario`, datosCambio);
  }

  /**
   * Obtener usuarios disponibles con rol ALUMNO que no tengan alumno asignado
   */
  obtenerUsuariosDisponibles(): Observable<UsuariosDisponiblesResponse> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/disponibles?rol=ALUMNO`).pipe(
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

  /**
   * Validar código QR
   */
  validarCodigoQR(codigoQR: string): Observable<{success: boolean, message: string, data: {alumno: Alumno, valido: boolean}}> {
    return this.http.get<{success: boolean, message: string, data: {alumno: Alumno, valido: boolean}}>(`${this.apiUrl}/alumnos/validate-qr/${codigoQR}`);
  }

  /**
   * Importar alumnos desde Excel
   */
  importarDesdeExcel(file: File, turnoId: string, crearUsuarios: boolean = true): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('turnoId', turnoId);
    formData.append('crear_usuarios', crearUsuarios.toString());

    return this.http.post<any>(`${this.apiUrl}/alumnos/register-alumno-for-excel`, formData);
  }
}
