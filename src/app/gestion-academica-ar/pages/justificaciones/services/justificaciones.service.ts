import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
  JustificacionesResponse, 
  JustificacionesQueryParams,
  EstadisticasJustificaciones 
} from '../interfaces/justificaciones.interface';

@Injectable({
  providedIn: 'root'
})
export class JustificacionesService {
  private baseUrl = `${environment.apiUrl}/detalle-justificaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de justificaciones con filtros opcionales
   */
  obtenerJustificaciones(filtros?: JustificacionesQueryParams): Observable<JustificacionesResponse> {
    let params = new HttpParams();

    // Agregar parámetros de filtro si existen
    if (filtros) {
      if (filtros.codigo_alumno) {
        params = params.set('codigo_alumno', filtros.codigo_alumno);
      }
      if (filtros.estado) {
        params = params.set('estado', filtros.estado);
      }
      if (filtros.tipo_justificacion) {
        params = params.set('tipo_justificacion', filtros.tipo_justificacion);
      }
      if (filtros.fecha_desde) {
        params = params.set('fecha_desde', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params = params.set('fecha_hasta', filtros.fecha_hasta);
      }
      if (filtros.pagina) {
        params = params.set('pagina', filtros.pagina.toString());
      }
      if (filtros.elementos_por_pagina) {
        params = params.set('elementos_por_pagina', filtros.elementos_por_pagina.toString());
      }
    }

    console.log('🔍 [JUSTIFICACIONES SERVICE] Obteniendo justificaciones con filtros:', filtros);
    console.log('📡 [JUSTIFICACIONES SERVICE] URL:', this.baseUrl);
    console.log('📡 [JUSTIFICACIONES SERVICE] Params:', params.toString());

    return this.http.get<JustificacionesResponse>(this.baseUrl, { params });
  }

  /**
   * Obtiene estadísticas de justificaciones
   */
  obtenerEstadisticas(): Observable<EstadisticasJustificaciones> {
    // Obtener todas las justificaciones para calcular estadísticas
    return new Observable(observer => {
      this.obtenerJustificaciones({ elementos_por_pagina: 1000 }).subscribe({
        next: (response) => {
          const estadisticas: EstadisticasJustificaciones = {
            total: response.total,
            pendientes: response.data.filter(j => j.estado === 'PENDIENTE').length,
            aprobadas: response.data.filter(j => j.estado === 'APROBADA').length,
            rechazadas: response.data.filter(j => j.estado === 'RECHAZADA').length,
            en_revision: response.data.filter(j => j.estado === 'EN_REVISION').length
          };
          observer.next(estadisticas);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ [JUSTIFICACIONES SERVICE] Error al obtener estadísticas:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtiene justificaciones por código de alumno
   */
  obtenerJustificacionesPorAlumno(codigoAlumno: string): Observable<JustificacionesResponse> {
    return this.obtenerJustificaciones({ codigo_alumno: codigoAlumno });
  }

  /**
   * Obtiene justificaciones por estado
   */
  obtenerJustificacionesPorEstado(estado: string): Observable<JustificacionesResponse> {
    return this.obtenerJustificaciones({ estado: estado as any });
  }

  /**
   * Obtiene justificaciones por tipo
   */
  obtenerJustificacionesPorTipo(tipo: string): Observable<JustificacionesResponse> {
    return this.obtenerJustificaciones({ tipo_justificacion: tipo as any });
  }

  /**
   * Obtiene justificaciones por rango de fechas
   */
  obtenerJustificacionesPorFechas(fechaDesde: string, fechaHasta: string): Observable<JustificacionesResponse> {
    return this.obtenerJustificaciones({ 
      fecha_desde: fechaDesde, 
      fecha_hasta: fechaHasta 
    });
  }
}
