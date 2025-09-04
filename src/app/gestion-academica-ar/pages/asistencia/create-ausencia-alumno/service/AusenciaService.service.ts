// interfaces/asistencia.interface.ts
export interface RegistroAusenciasMasivas {
  horaPersonalizada?: string;
}

export interface RegistroAusenciaAlumno {
  codigo: string;
  fecha?: string;
}

export interface ResponseAusenciasMasivas {
  message: string;
  cantidadRegistradas: number; // Era cantidadAusencias
  duplicados: string[];        // NUEVO campo
  horaUsada: string;
}

export interface ResponseAusenciaAlumno {
  message: string;
  asistencia: {
    id: string;
    alumno: string;
    codigo: string;
    fecha: string;
    estado: string;
  };
}

export interface EstudianteInfo {
  id_alumno: string;
  codigo: string;
  nombre: string;
  apellido: string;
  seccion: string;
  grado: number;
  nivel: string;
}

// services/asistencia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private baseUrl = `${environment.apiUrl}/asistencia`;

  constructor(private http: HttpClient) {}

  registrarAusenciasMasivas(data: RegistroAusenciasMasivas): Observable<ResponseAusenciasMasivas> {
    return this.http.post<ResponseAusenciasMasivas>(`${this.baseUrl}/registrar-ausencias-masivas`, data);
  }

  crearAusenciaAlumno(data: RegistroAusenciaAlumno): Observable<ResponseAusenciaAlumno> {
    return this.http.post<ResponseAusenciaAlumno>(`${this.baseUrl}/crear-ausencia-alumno`, data);
  }

  buscarEstudiantePorCodigo(codigo: string): Observable<EstudianteInfo> {
    return this.http.get<EstudianteInfo>(`${environment.apiUrl}/alumnos/codigo/${codigo}`);
  }
}
