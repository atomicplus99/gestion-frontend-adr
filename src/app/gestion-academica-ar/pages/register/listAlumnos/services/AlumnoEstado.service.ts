import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AlumnoEstado } from '../models/AlumnoEstado.model';
import { environment } from '../../../../../../environments/environment';



@Injectable()
export class AlumnosEstadoService {
  constructor(private http: HttpClient) { }


  getAlumnosEstado(): Observable<AlumnoEstado[]> {
    return this.http
      .get<AlumnoEstado[]>(`${environment.apiUrl}/alumnos/estado`)
      .pipe(
        map(data => this.convertirAMayusculas(data)),
        map(data => {
          // Normalizar estados
          data.forEach(alumno => {
            if (alumno.estado_actual?.estado) {
              alumno.estado_actual.estado = this.normalizarEstado(alumno.estado_actual.estado);
            }
          });
          return data;
        })
      );
  }


  private normalizarEstado(estado: string): string {
    if (!estado) return '';
    const estadoUpper = estado.toUpperCase();

    if (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE') return 'ACTIVO';
    if (estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVE') return 'INACTIVO';

    return estadoUpper;
  }

  private convertirAMayusculas(alumnos: AlumnoEstado[]): AlumnoEstado[] {
    return alumnos.map(alumno => {
      return {
        ...alumno,
        codigo: alumno.codigo?.toUpperCase() || '',
        dni_alumno: alumno.dni_alumno?.toUpperCase() || '',
        nombre: alumno.nombre?.toUpperCase() || '',
        apellido: alumno.apellido?.toUpperCase() || '',
        direccion: alumno.direccion?.toUpperCase() || '',
        nivel: alumno.nivel?.toUpperCase() || '',
        seccion: alumno.seccion?.toUpperCase() || '',
        turno: {
          turno: alumno.turno?.turno?.toUpperCase() || ''
        },
        usuario: {
          nombre_usuario: alumno.usuario?.nombre_usuario?.toUpperCase() || '',
          rol_usuario: alumno.usuario?.rol_usuario?.toUpperCase() || ''
        },
        estado_actual: {
          estado: alumno.estado_actual?.estado?.toUpperCase() || '',
          observacion: alumno.estado_actual?.observacion?.toUpperCase() || '',
          fecha_actualizacion: alumno.estado_actual?.fecha_actualizacion || ''
        }
      };
    });
  }

  /**
   * Cuenta alumnos por estado
   */
  contarPorEstado(datos: AlumnoEstado[], estado: string): number {
    return datos.filter(alumno =>
      alumno.estado_actual?.estado === estado
    ).length;
  }

  /**
   * Obtiene todos los niveles únicos de la lista de alumnos
   */
  obtenerNivelesUnicos(alumnos: AlumnoEstado[]): string[] {
    const nivelesSet = new Set<string>();

    alumnos.forEach(alumno => {
      if (alumno.nivel) {
        nivelesSet.add(alumno.nivel);
      }
    });

    return Array.from(nivelesSet).sort();
  }
}