import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UserStoreService } from '../../../../auth/store/user.store';
import { 
  BackendResponse, 
  ResultadoEjecucion, 
  EstadisticasAusencias,
  PayloadEjecucion,
  PayloadProgramacion,
  RespuestaProgramacion,
  AusenciaProgramada,
  RespuestaCancelacion,
  TurnosDisponibles
} from '../interfaces/ausencias-masivas.interface';

@Injectable({
  providedIn: 'root'
})
export class AusenciasMasivasService {

  constructor(
    private http: HttpClient,
    private userStore: UserStoreService
  ) { }

  /**
   * Programa ausencias automáticas para una fecha y hora futura
   * @param fecha Fecha requerida en formato YYYY-MM-DD
   * @param hora Hora requerida en formato HH:MM:SS
   * @param turnos String de turno opcional: 'MAÑANA', 'TARDE', 'AMBOS'
   * @returns Observable con la respuesta de programación
   */
  programarAusencias(fecha: string, hora: string, turnos: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<RespuestaProgramacion> {

    
    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/programar`;
    
    // Obtener el user-id del usuario autenticado
    const user = this.userStore.getUserSilently();
    const userId = user?.idUser;
    
    if (!userId) {
      throw new Error('Usuario no autenticado. No se puede obtener el user-id.');
    }
    
    
    // Crear headers con el user-id
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': userId
    });
    
    const payload: PayloadProgramacion = {
      fecha,
      hora,
      turnos
    };

    
    
    
    return this.http.post<BackendResponse<RespuestaProgramacion>>(url, payload, { headers })
      .pipe(
        map(response => {
          
          if (response.data) {
          }
          
          return response.data;
        })
      );
  }

  /**
   * Ejecuta el programa de ausencias masivas (mantenido para compatibilidad)
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   * @param hora Hora opcional en formato HH:MM:SS
   * @param turnos Turno opcional: MAÑANA | TARDE | AMBOS (por defecto AMBOS)
   * @returns Observable con el resultado de la ejecución
   */
  ejecutarPrograma(fecha?: string, hora?: string, turnos?: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<ResultadoEjecucion> {
    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/ejecutar`;
    
    // Construir el payload del body
    const payload: PayloadEjecucion = {};
    
    if (fecha) {
      payload.fecha = fecha;
    }
    
    if (hora) {
      payload.hora = hora;
    }
    
    if (turnos && turnos !== TurnosDisponibles.AMBOS) {
      payload.turnos = turnos;
    }

    return this.http.post<BackendResponse<ResultadoEjecucion>>(url, payload)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtiene estadísticas detalladas del estado de asistencias
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   * @param turnos Turno opcional: MAÑANA | TARDE | AMBOS (por defecto AMBOS)
   * @returns Observable con las estadísticas
   */
  obtenerEstadisticas(fecha?: string, turnos?: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<EstadisticasAusencias> {
    let url = `${environment.apiUrl}/asistencia/ausencias-masivas/estadisticas`;
    
    const params: string[] = [];
    
    if (fecha) {
      params.push(`fecha=${fecha}`);
    }
    
    if (turnos && turnos !== TurnosDisponibles.AMBOS) {
      params.push(`turnos=${turnos}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<BackendResponse<EstadisticasAusencias>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Cancela una ausencia programada
   * @param id ID de la ausencia programada a cancelar
   * @returns Observable con la respuesta de cancelación
   */
  cancelarAusenciaProgramada(id: string): Observable<RespuestaCancelacion> {
    // Obtener el user-id del usuario autenticado
    const user = this.userStore.getUserSilently();
    const userId = user?.idUser;
    
    if (!userId) {
      throw new Error('Usuario no autenticado. No se puede obtener el user-id.');
    }
    
    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/cancelar/${id}`;
    
    // Crear headers con el user-id
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': userId
    });
    
    return this.http.post<BackendResponse<RespuestaCancelacion>>(url, {}, { headers })
      .pipe(
        map(response => {
          return response.data;
        })
      );
  }

  /**
   * Obtiene las ausencias programadas
   * @param incluirUserId Si incluir el header user-id para filtrar solo las programaciones del usuario actual
   * @returns Observable con las ausencias programadas
   */
  obtenerAusenciasProgramadas(incluirUserId: boolean = false): Observable<AusenciaProgramada[]> {
    let headers = new HttpHeaders();
    
    if (incluirUserId) {
      const user = this.userStore.getUserSilently();
      const userId = user?.idUser;
      
      if (userId) {
        headers = headers.set('user-id', userId);
      }
    }

    return this.http.get<BackendResponse<AusenciaProgramada[]>>(`${environment.apiUrl}/asistencia/ausencias-masivas/programadas`, { headers })
      .pipe(
        map(response => {
          return response.data || [];
        })
      );
  }



  /**
   * Obtiene el historial de ejecuciones
   * @returns Observable con el historial
   */
  obtenerHistorial(): Observable<any[]> {
    return this.http.get<BackendResponse<any[]>>(`${environment.apiUrl}/asistencia/ausencias-masivas/historial`)
      .pipe(
        map(response => {
          return response.data || [];
        })
      );
  }

  /**
   * Elimina todo el historial de ejecuciones de ausencias masivas
   * @param confirmar Debe ser "true" para confirmar la eliminación
   * @returns Observable con la respuesta de eliminación
   */
  eliminarHistorial(confirmar: boolean = false): Observable<any> {
    if (!confirmar) {
      throw new Error('Debe confirmar la eliminación con confirmar=true');
    }

    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/historial?confirmar=true`;
    
    return this.http.delete<BackendResponse<any>>(url)
      .pipe(
        map(response => {
          return response.data;
        })
      );
  }

  /**
   * Valida si una fecha es válida para programar (hoy o futuras)
   * @param fecha Fecha a validar
   * @returns true si la fecha es válida
   */
  validarFechaProgramacion(fecha: string): boolean {
    // Crear fecha de Perú (UTC-5)
    const ahora = new Date();
    const peruOffset = -5 * 60; // -5 horas en minutos
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const peruTime = new Date(utc + (peruOffset * 60000));
    
    // Crear fechas solo con día, mes y año (sin hora)
    const hoySoloFecha = new Date(peruTime.getFullYear(), peruTime.getMonth(), peruTime.getDate());
    
    // Parsear la fecha recibida correctamente (formato YYYY-MM-DD)
    const [año, mes, dia] = fecha.split('-').map(Number);
    const fechaSoloFecha = new Date(año, mes - 1, dia); // mes - 1 porque Date usa 0-11
    
    return fechaSoloFecha >= hoySoloFecha;
  }

  /**
   * Formatea una fecha para mostrar
   * @param fecha Fecha a formatear
   * @returns Fecha formateada
   */
  formatearFecha(fecha: string): string {
    try {
      if (!fecha || typeof fecha !== 'string') {
        return 'Fecha inválida';
      }

      let fechaObj: Date;

      if (fecha.includes('/')) {
        const partes = fecha.split('/');
        if (partes.length === 3) {
          const [parte1, parte2, parte3] = partes.map(Number);
          if (parte3 >= 1000) {
            fechaObj = new Date(parte3, parte2 - 1, parte1);
          } else if (parte1 >= 1000) {
            fechaObj = new Date(parte1, parte2 - 1, parte3);
          } else {
            fechaObj = new Date(parte3, parte2 - 1, parte1);
          }
        } else {
          return 'Fecha inválida';
        }
      } else if (fecha.includes('-')) {
        const [año, mes, dia] = fecha.split('-').map(Number);
        if (isNaN(año) || isNaN(mes) || isNaN(dia)) {
          return 'Fecha inválida';
        }
        fechaObj = new Date(año, mes - 1, dia);
      } else {
        return 'Fecha inválida';
      }

      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }

      const fechaFormateada = fechaObj.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return fechaFormateada;
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Valida si una fecha es válida para ejecutar el programa (no futuras)
   * @param fecha Fecha a validar
   * @returns true si la fecha es válida
   */
  validarFecha(fecha: string): boolean {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return fechaObj <= hoySoloFecha;
  }
}
