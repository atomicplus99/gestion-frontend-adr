import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

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

export interface Asistencia {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida?: string;
  estado_asistencia: 'PUNTUAL' | 'TARDANZA';
  fecha: Date;
  alumno: Alumno;
}

export interface AsistenciaConAlumno {
  alumno: Alumno;
  asistencias: Asistencia[];
}

// Interfaces para las respuestas del backend
export interface BackendResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private baseUrl = `${environment.apiUrl}/asistencia`;
  private turnoUrl = `${environment.apiUrl}/turno`;

  constructor(private http: HttpClient) {}

  getAllAsistencias(): Observable<Asistencia[]> {
    return this.http.get<BackendResponse<Asistencia[]>>(`${this.baseUrl}/list`).pipe(
      map(response => {
        console.log('Respuesta getAllAsistencias:', response);
        if (response && response.success && response.data) {
          return response.data;
        }
        // Si la respuesta no tiene la estructura esperada, devolver array vacío
        return [];
      })
    );
  }

  getAsistenciaPorCodigoAlumno(codigo: string): Observable<AsistenciaConAlumno> {
    return this.http.get<BackendResponse<AsistenciaConAlumno>>(`${this.baseUrl}/list/alumno/${codigo}`).pipe(
      map(response => {
        console.log('Respuesta getAsistenciaPorCodigoAlumno:', response);
        if (response && response.success && response.data) {
          return response.data;
        }
        // Si la respuesta no tiene la estructura esperada, devolver objeto vacío
        return { alumno: {} as Alumno, asistencias: [] };
      })
    );
  }

  getAllTurnos(): Observable<Turno[]> {
    return this.http.get<BackendResponse<Turno[]>>(this.turnoUrl).pipe(
      map(response => {
        console.log('Respuesta getAllTurnos:', response);
        if (response && response.success && response.data) {
          return response.data;
        }
        // Si la respuesta no tiene la estructura esperada, devolver array vacío
        return [];
      })
    );
  }
}