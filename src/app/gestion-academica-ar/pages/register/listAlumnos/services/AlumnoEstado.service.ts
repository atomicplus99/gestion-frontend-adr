import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { AlumnoEstado } from '../models/AlumnoEstado.model';
import { environment } from '../../../../../../environments/environment';



@Injectable()
export class AlumnosEstadoService {
  constructor(private http: HttpClient) { }


  getAlumnosEstado(): Observable<AlumnoEstado[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/alumnos/estado`)  // ✅ Cambiado a 'any' para manejar respuesta real
      .pipe(
        map(response => {

          
          // ✅ Extraer el array de alumnos de la respuesta del backend
          let alumnos: AlumnoEstado[] = [];
          
          if (Array.isArray(response)) {
            // Si es un array directo
            alumnos = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            // Si es { data: [...] }
            alumnos = response.data;
          } else if (response && response.alumnos && Array.isArray(response.alumnos)) {
            // Si es { alumnos: [...] }
            alumnos = response.alumnos;
          } else if (response && response.result && Array.isArray(response.result)) {
            // Si es { result: [...] }
            alumnos = response.result;
          } else {
            console.error('❌ [ALUMNOS-ESTADO] Formato de respuesta no reconocido:', response);
            return [];
          }
          

          return alumnos;
        }),
        map(alumnos => this.convertirAMayusculas(alumnos)),
        map(alumnos => {
          // Normalizar estados
          alumnos.forEach(alumno => {
            if (alumno.estado_actual?.estado) {
              alumno.estado_actual.estado = this.normalizarEstado(alumno.estado_actual.estado);
            }
          });
          return alumnos;
        }),
        catchError(error => {
          console.error('❌ [ALUMNOS-ESTADO] Error en la petición:', error);
          return of([]); // ✅ Retornar array vacío en caso de error
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