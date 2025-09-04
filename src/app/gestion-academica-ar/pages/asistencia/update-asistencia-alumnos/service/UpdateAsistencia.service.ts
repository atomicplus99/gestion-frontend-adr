// src/app/services/asistencia.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

// Interfaces
export interface VerificarAsistenciaResponse {
  tiene_asistencia: boolean;
  mensaje: string;
  asistencia?: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida: string | null;
    estado_asistencia: string;
    fecha: Date;
  };
  alumno?: {
    id_alumno: string;
    codigo: string;
    nombre: string;
    apellido: string;
    seccion: string;
    grado: number;
    nivel: string;
    turno?: string; // Turno como string directo, no objeto
  };
}

export interface UpdateAsistenciaRequest {
  hora_de_llegada?: string;
  hora_salida?: string;
  estado_asistencia?: EstadoAsistencia;
  motivo: string;
  id_auxiliar?: string; // Para auxiliares
  id_usuario?: string; // Para administrador o director
  fecha?: string; // Para fechas específicas diferentes a hoy
}

export interface UpdateAsistenciaResponse {
  success: boolean;
  mensaje: string;
  asistencia_actualizada: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida: string | null;
    estado_asistencia: EstadoAsistencia;
    fecha: Date;
  };
  alumno: {
    id_alumno: string;
    codigo: string;
    nombre: string;
    apellido: string;
  };
}

export interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

// Interfaces para las respuestas del backend
export interface BackendResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

export enum EstadoAsistencia {
  PUNTUAL = 'PUNTUAL',
  TARDANZA = 'TARDANZA',
  AUSENTE = 'AUSENTE',
  ANULADO = 'ANULADO',
  JUSTIFICADO = 'JUSTIFICADO'
}


@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private readonly baseUrl = `${environment.apiUrl}/asistencia`

  constructor(private http: HttpClient) {}

  verificarAsistenciaPorCodigo(codigo: string, fecha?: string): Observable<VerificarAsistenciaResponse> {
    // Usar fecha proporcionada o fecha actual si no se proporciona
    const fechaConsulta = fecha || this.obtenerFechaActualPeru();
    const url = `${this.baseUrl}/verificar/${codigo}?fecha=${fechaConsulta}`;
    
    console.log('🔍 Verificando asistencia para fecha:', fechaConsulta);
    console.log('🌐 URL de verificación:', url);
    
    return this.http.get<BackendResponse<VerificarAsistenciaResponse>>(url)
      .pipe(
        map(response => {
          console.log('🔍 Respuesta completa del backend:', response);
          if (response && response.success && response.data) {
            return response.data;
          }
          // Si la respuesta no tiene la estructura esperada, devolver objeto vacío
          return { tiene_asistencia: false, mensaje: 'Respuesta del backend no válida' };
        }),
        catchError(this.handleError)
      );
  }

  actualizarAsistenciaPorCodigo(codigo: string, updateData: UpdateAsistenciaRequest): Observable<UpdateAsistenciaResponse> {
    console.log('🔧 SERVICIO EJECUTÁNDOSE - actualizarAsistenciaPorCodigo llamado con:', { codigo, updateData });
    console.log('🌐 URL del servicio:', `${this.baseUrl}/actualizar/${codigo}`);
    
    return this.http.put<BackendResponse<UpdateAsistenciaResponse>>(`${this.baseUrl}/actualizar/${codigo}`, updateData)
      .pipe(
        map(response => {
          console.log('🔄 Respuesta completa del backend:', response);
          if (response && response.success && response.data) {
            return response.data;
          }
          // Si la respuesta no tiene la estructura esperada, devolver objeto vacío
          return { success: false, mensaje: 'Respuesta del backend no válida' } as UpdateAsistenciaResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene la fecha actual en zona horaria local (Perú)
   */
  private obtenerFechaActualPeru(): string {
    // Obtener fecha actual en zona horaria local
    const ahora = new Date();
    
    // Obtener componentes de fecha en zona horaria local
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    
    // Formatear como YYYY-MM-DD
    return `${año}-${mes}-${dia}`;
  }

  /**
   * Verifica si una fecha es el día de hoy
   */
  esFechaHoy(fecha: string): boolean {
    return fecha === this.obtenerFechaActualPeru();
  }

  /**
   * Obtiene la fecha de hoy en formato YYYY-MM-DD
   */
  getFechaHoy(): string {
    return this.obtenerFechaActualPeru();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      const serverError = error.error as ErrorResponse;
      if (serverError?.message) {
        if (Array.isArray(serverError.message)) {
          errorMessage = serverError.message.join(', ');
        } else {
          errorMessage = serverError.message;
        }
      } else {
        errorMessage = `Error HTTP: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('Error en AsistenciaService:', error);
    return throwError(() => errorMessage);
  }
}