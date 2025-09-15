// services/audit-asistencia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

// Interfaces para la respuesta del endpoint
export interface AsistenciaAudit {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida: string;
  estado_asistencia: string;
  fecha: string;
}

export interface AlumnoAudit {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
}

export interface AdministradorAudit {
  id_administrador: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface ActualizacionAsistencia {
  id: string;
  id_asistencia: string;
  id_alumno: string;
  alumno: {
    id_alumno: string;
    nombre: string;
    apellido: string;
    codigo: string;
  };
  administrador: {
    id_administrador: string;
    nombre: string;
    apellido: string;
  };
  motivo: string;
  accion_realizada: string;
  accion_amigable: string;
  fecha_actualizacion: string;
}

export interface AuditAsistenciaResponse {
  success: boolean;
  message: string;
  data: ActualizacionAsistencia[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditAsistenciaService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las actualizaciones de asistencia
   */
  obtenerActualizacionesAsistencia(): Observable<AuditAsistenciaResponse> {
    return this.http.get<AuditAsistenciaResponse>(`${this.baseUrl}/actualizaciones-asistencia`);
  }

  /**
   * Formatea la fecha para mostrar en la interfaz
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        console.log('Fecha inválida:', fecha);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', fecha, error);
      return 'Error en fecha';
    }
  }

  /**
   * Obtiene el estado de asistencia con color
   */
  obtenerColorEstado(estado: string): string {
    const colores = {
      'PUNTUAL': 'text-green-600 bg-green-100',
      'TARDANZA': 'text-yellow-600 bg-yellow-100',
      'AUSENTE': 'text-red-600 bg-red-100',
      'JUSTIFICADO': 'text-blue-600 bg-blue-100',
      'ANULADO': 'text-gray-600 bg-gray-100'
    };
    return colores[estado as keyof typeof colores] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Obtiene el icono para el estado de asistencia
   */
  obtenerIconoEstado(estado: string): string {
    const iconos = {
      'PUNTUAL': 'M5 13l4 4L19 7',
      'TARDANZA': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
      'AUSENTE': 'M6 18L18 6M6 6l12 12',
      'JUSTIFICADO': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'ANULADO': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    };
    return iconos[estado as keyof typeof iconos] || 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z';
  }
}
