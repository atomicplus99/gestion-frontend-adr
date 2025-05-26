import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Alumno, PersonalAlumno } from '../pages/register/interfaces/alumno.interface';
import { AlumnoUpdate } from '../pages/register/actualizar-alumno/actualizar-alumno.component';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly apiUrl = 'http://localhost:3000';
  
  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/turno`);
  }

  // Método modificado para evitar que la respuesta actualice el UserStore
  registrarAlumno(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/alumnos/registrar`, data)
      .pipe(
        // Transformamos la respuesta para eliminar cualquier campo que pueda
        // ser interpretado como información del usuario autenticado
        map(response => {
          // Si la respuesta es un objeto y contiene un campo 'user',
          // creamos una nueva respuesta sin ese campo
          if (response && typeof response === 'object') {
            // Destructuramos para extraer 'user' y 'token' y quedarnos con el resto
            const { user, token, ...safeResponse } = response as any;
            
            // Devolvemos solo la parte segura de la respuesta
            return safeResponse;
          }
          
          // Si no hay un objeto o no hay user/token, devolvemos la respuesta original
          return response;
        })
      );
  }

  obtenerTodos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(this.apiUrl);
  }

  actualizar(id: string, data: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.apiUrl}/alumno${id}`, data);
  }

  getByCodigo(codigo: string): Observable<AlumnoUpdate> {
    return this.http
      .get<AlumnoUpdate>(`${this.apiUrl}/alumnos/codigo/${codigo}`);
  }

  actualizarAlumno(alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(
      `${this.apiUrl}alumnos/${alumno.id_alumno}`,
      alumno
    );
  }
}