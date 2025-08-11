import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alumno } from '../models/AsignarAlumnoApoderado.model';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlumnoAsignService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getAllAlumnos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.baseUrl}/alumnos`);
  }

  getAlumnoByCode(codigo: string): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.baseUrl}/alumnos/codigo/${codigo}`);
  }
}