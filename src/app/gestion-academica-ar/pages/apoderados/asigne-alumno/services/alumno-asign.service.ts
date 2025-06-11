import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alumno } from '../models/AsignarAlumnoApoderado.model';


@Injectable({
  providedIn: 'root'
})
export class AlumnoAsignService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  getAllAlumnos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.baseUrl}/alumnos`);
  }

  getAlumnoByCode(codigo: string): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.baseUrl}/alumnos/codigo/${codigo}`);
  }
}