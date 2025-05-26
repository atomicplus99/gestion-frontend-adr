// src/app/services/asistencia.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    turno: {
      id_turno: string;
      hora_inicio: string;
      hora_fin: string;
      turno: string;
    };
  };
}

export interface UpdateAsistenciaRequest {
  hora_de_llegada?: string;
  hora_salida?: string;
  estado_asistencia?: EstadoAsistencia;
  motivo: string;
  id_auxiliar: string;
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

export enum EstadoAsistencia {
  PUNTUAL = 'PUNTUAL',
  TARDANZA = 'TARDANZA'
}


@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private readonly baseUrl = 'http://localhost:3000/asistencia';

  constructor(private http: HttpClient) {}

  verificarAsistenciaPorCodigo(codigo: string): Observable<VerificarAsistenciaResponse> {
    return this.http.get<VerificarAsistenciaResponse>(`${this.baseUrl}/verificar/${codigo}`)
      .pipe(catchError(this.handleError));
  }

  actualizarAsistenciaPorCodigo(codigo: string, updateData: UpdateAsistenciaRequest): Observable<UpdateAsistenciaResponse> {
    return this.http.put<UpdateAsistenciaResponse>(`${this.baseUrl}/actualizar/${codigo}`, updateData)
      .pipe(catchError(this.handleError));
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