// src/app/services/asistencia.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

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
  fecha: string; // Cambiado de Date a string porque el backend envía string
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

// ✅ INTERFACE CON ROLES DINÁMICOS Y FECHA OPCIONAL
export interface AnularAsistenciaRequest {
  codigo_estudiante: string;
  motivo: string;
  id_auxiliar?: string; // Para auxiliares
  id_usuario?: string; // Para administrador o director
  fecha?: string; // Para fechas específicas (formato YYYY-MM-DD)
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
  private readonly baseUrlAlumnos = `${environment.apiUrl}/alumnos`;
  private readonly baseUrlAsistencia = `${environment.apiUrl}/asistencia`;

  constructor(private http: HttpClient) {}

  // ✅ BUSCAR ALUMNO POR CÓDIGO
  buscarAlumnoPorCodigo(codigo: string): Observable<Alumno> {

    
    // Definir la interfaz de respuesta del backend
    interface BackendResponse<T> {
      success: boolean;
      message: string;
      timestamp: string;
      data: T;
    }
    
    return this.http.get<BackendResponse<Alumno>>(`${this.baseUrlAlumnos}/codigo/${codigo}`)
      .pipe(
        map(response => {

          return response.data;
        })
      );
  }

  // ✅ OBTENER ASISTENCIAS DEL DÍA ACTUAL DE UN ALUMNO
  obtenerAsistenciasAlumno(codigo: string, fecha?: string): Observable<Asistencia[]> {
    const fechaBusqueda = fecha || this.getFechaHoy();

    
    // Definir la interfaz de respuesta del backend
    interface BackendResponse<T> {
      success: boolean;
      message: string;
      timestamp: string;
      data: T;
    }
    
    return this.http.get<BackendResponse<AsistenciaConAlumno>>(`${this.baseUrlAsistencia}/list/alumno/${codigo}`)
      .pipe(
        map(response => {

          const data = response.data;
          
          // Filtrar asistencias de la fecha especificada
          // Comparar strings directamente para evitar problemas de zona horaria

          console.log(`📅 Todas las asistencias del alumno:`, data.asistencias.map(a => ({ 
            id: a.id_asistencia, 
            fecha: a.fecha, 
            fechaSplit: a.fecha.split('T')[0] 
          })));
          
          const asistenciasFecha = data.asistencias.filter(asistencia => {
            // Extraer solo la fecha (YYYY-MM-DD) de la asistencia
            const fechaAsistencia = asistencia.fecha.split('T')[0];
            const coincide = fechaAsistencia === fechaBusqueda;

            return coincide;
          });
          

          return asistenciasFecha;
        })
      );
  }

  // ✅ MANTENER COMPATIBILIDAD: Método para obtener asistencias de hoy
  obtenerAsistenciasHoyAlumno(codigo: string): Observable<Asistencia[]> {
    return this.obtenerAsistenciasAlumno(codigo);
  }

  // ✅ ANULAR ASISTENCIA DEL DÍA ACTUAL (SIN FECHA ESPECÍFICA)
  anularAsistencia(request: AnularAsistenciaRequest): Observable<AnularAsistenciaResponse> {

    
    // Definir la interfaz de respuesta del backend
    interface BackendResponse<T> {
      success: boolean;
      message: string;
      timestamp: string;
      data: T;
    }
    
    return this.http.patch<BackendResponse<AnularAsistenciaResponse>>(`${this.baseUrlAsistencia}/anular`, request)
      .pipe(
        map(response => {

          return response.data;
        })
      );
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

  // ✅ UTILIDADES PARA FECHAS
  esFechaHoy(fecha: string): boolean {
    // Obtener fecha actual en zona horaria de Perú
    const fechaHoy = this.getFechaHoy();
    return fecha === fechaHoy;
  }

  getFechaHoy(): string {
    // Obtener fecha y hora peruana real
    const ahora = new Date();

    
    // Crear fecha en zona horaria de Perú (UTC-5)
    const fechaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));

    
    // Formatear fecha en formato YYYY-MM-DD
    const año = fechaPeru.getFullYear();
    const mes = String(fechaPeru.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaPeru.getDate()).padStart(2, '0');
    
    const fechaFormateada = `${año}-${mes}-${dia}`;

    
    return fechaFormateada;
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
    // Obtener fecha y hora peruana real
    const ahora = new Date();
    
    // Crear fecha en zona horaria de Perú (UTC-5)
    const fechaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    return fechaPeru.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}