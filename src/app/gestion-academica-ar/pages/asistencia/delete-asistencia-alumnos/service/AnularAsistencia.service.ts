// src/app/services/asistencia.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ✅ INTERFACES SIMPLIFICADAS
export interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno?: Turno;
  usuario?: Usuario;
}

export interface Turno {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
  turno: string;
}

export interface Usuario {
  id_user: string;
  nombre_usuario: string;
  rol_usuario: string;
  profile_image?: string;
}

export interface Asistencia {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida?: string;
  estado_asistencia: EstadoAsistencia;
  fecha: Date;
  alumno: Alumno;
}

export interface AsistenciaConAlumno {
  alumno: Alumno;
  asistencias: Asistencia[];
}

export enum EstadoAsistencia {
  PUNTUAL = 'PUNTUAL',
  TARDANZA = 'TARDANZA',
  AUSENTE = 'AUSENTE',
  ANULADO = 'ANULADO',
  JUSTIFICADO = 'JUSTIFICADO'
}

// ✅ INTERFACE SIMPLIFICADA - SIN FECHA (SIEMPRE DÍA ACTUAL)
export interface AnularAsistenciaRequest {
  codigo_estudiante: string;
  motivo: string;
  id_auxiliar: string;
  // fecha se omite - siempre será día actual
}

export interface AnularAsistenciaResponse {
  message: string;
  codigo_estudiante: string;
  fecha: string;
  motivo: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private readonly baseUrlAlumnos = 'http://localhost:3000/alumnos';
  private readonly baseUrlAsistencia = 'http://localhost:3000/asistencia';

  constructor(private http: HttpClient) {}

  // ✅ BUSCAR ALUMNO POR CÓDIGO
  buscarAlumnoPorCodigo(codigo: string): Observable<Alumno> {
    console.log(`🔍 Buscando alumno por código: ${codigo}`);
    return this.http.get<Alumno>(`${this.baseUrlAlumnos}/codigo/${codigo}`);
  }

  // ✅ OBTENER ASISTENCIAS DEL DÍA ACTUAL DE UN ALUMNO
  obtenerAsistenciasHoyAlumno(codigo: string): Observable<Asistencia[]> {
    console.log(`📋 Obteniendo asistencias de hoy del alumno: ${codigo}`);
    
    return this.http.get<AsistenciaConAlumno>(`${this.baseUrlAsistencia}/list/alumno/${codigo}`)
      .pipe(
        map(data => {
          // Filtrar solo asistencias del día actual
          const hoy = new Date();
          const asistenciasHoy = data.asistencias.filter(asistencia => {
            const fechaAsistencia = new Date(asistencia.fecha);
            return this.esMismaFecha(fechaAsistencia, hoy);
          });
          
          console.log(`📅 Asistencias de hoy encontradas: ${asistenciasHoy.length}`);
          return asistenciasHoy;
        })
      );
  }

  // ✅ ANULAR ASISTENCIA DEL DÍA ACTUAL (SIN FECHA ESPECÍFICA)
  anularAsistencia(request: AnularAsistenciaRequest): Observable<AnularAsistenciaResponse> {
    console.log('🗑️ Anulando asistencia del día actual:', request);
    return this.http.patch<AnularAsistenciaResponse>(`${this.baseUrlAsistencia}/anular`, request);
  }

  // ✅ HELPER: VERIFICAR SI SE PUEDE ANULAR UN ESTADO
  puedeAnular(estado: EstadoAsistencia): boolean {
    return [
      EstadoAsistencia.PUNTUAL,
      EstadoAsistencia.TARDANZA
    ].includes(estado);
  }

  // ✅ HELPER: VERIFICAR SI DOS FECHAS SON DEL MISMO DÍA
  private esMismaFecha(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  // ✅ HELPER: OBTENER INFORMACIÓN DEL ESTADO
  obtenerInfoEstado(estado: EstadoAsistencia): {color: string, texto: string, descripcion: string} {
    switch (estado) {
      case EstadoAsistencia.PUNTUAL:
        return {
          color: 'bg-green-100 text-green-800',
          texto: 'Puntual',
          descripcion: 'Asistencia registrada a tiempo'
        };
      case EstadoAsistencia.TARDANZA:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          texto: 'Tardanza',
          descripcion: 'Llegada después del horario establecido'
        };
      case EstadoAsistencia.AUSENTE:
        return {
          color: 'bg-gray-100 text-gray-800',
          texto: 'Ausente',
          descripcion: 'No se presentó a clases'
        };
      case EstadoAsistencia.ANULADO:
        return {
          color: 'bg-red-100 text-red-800',
          texto: 'Anulado',
          descripcion: 'Asistencia anulada - será procesada automáticamente'
        };
      case EstadoAsistencia.JUSTIFICADO:
        return {
          color: 'bg-blue-100 text-blue-800',
          texto: 'Justificado',
          descripcion: 'Falta justificada oficialmente'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          texto: estado,
          descripcion: 'Estado no reconocido'
        };
    }
  }

  // ✅ HELPER: OBTENER FECHA DE HOY EN FORMATO LEGIBLE
  obtenerFechaHoy(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}