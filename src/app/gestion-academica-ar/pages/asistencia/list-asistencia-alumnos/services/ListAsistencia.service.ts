import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private baseUrl = 'http://localhost:3000/asistencia';
  private turnoUrl = 'http://localhost:3000/turno';

  constructor(private http: HttpClient) {}

  getAllAsistencias(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.baseUrl}/list`);
  }

  getAsistenciaPorCodigoAlumno(codigo: string): Observable<AsistenciaConAlumno> {
    return this.http.get<AsistenciaConAlumno>(`${this.baseUrl}/list/alumno/${codigo}`);
  }

  getAllTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.turnoUrl);
  }
}