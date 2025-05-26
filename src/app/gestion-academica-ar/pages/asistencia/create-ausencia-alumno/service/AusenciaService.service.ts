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

// services/asistencia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private baseUrl = 'http://localhost:3000/asistencia';

  constructor(private http: HttpClient) {}

  registrarAusenciasMasivas(data: RegistroAusenciasMasivas): Observable<ResponseAusenciasMasivas> {
    return this.http.post<ResponseAusenciasMasivas>(`${this.baseUrl}/registrar-ausencias-masivas`, data);
  }

  crearAusenciaAlumno(data: RegistroAusenciaAlumno): Observable<ResponseAusenciaAlumno> {
    return this.http.post<ResponseAusenciaAlumno>(`${this.baseUrl}/crear-ausencia-alumno`, data);
  }
}
