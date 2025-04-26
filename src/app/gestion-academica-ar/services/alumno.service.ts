import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Alumno, PersonalAlumno } from '../pages/register/interfaces/alumno.interface';

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  private readonly apiUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/turno`);
  }

  registrarAlumno(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/alumnos/registrar`, data); 
  }

  obtenerTodos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(this.apiUrl);
  }

  actualizar(id: string, data: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.apiUrl}/alumno${id}`, data);
  }

  getByCodigo(codigo: string): Observable<Alumno> {
    return this.http
      .get<Alumno>(`${this.apiUrl}/alumnos/codigo/${codigo}`)
      .pipe(
        tap({
          next: a => console.log('[AlumnoService] OK', a),
          error: e => console.error('[AlumnoService] ERR', e)
        })
      );
  }

  actualizarAlumno(alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(
      `${this.apiUrl}alumnos/${alumno.id_alumno}`,
      alumno
    );
  }

  
}
