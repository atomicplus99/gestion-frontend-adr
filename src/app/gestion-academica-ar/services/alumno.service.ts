import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap, catchError, retry, timeout } from 'rxjs';
import { Alumno, PersonalAlumno } from '../pages/register/interfaces/alumno.interface';
import { AlumnoUpdateShared, AlumnoSearchResponse } from '../../shared/interfaces/alumno-shared.interface';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../auth/services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient, private tokenService: TokenService) {}

  obtenerTurnos(): Observable<any[]> {


    
    return this.http.get<any[]>(`${this.apiUrl}/turno`).pipe(
      timeout(10000), // 10 segundos de timeout
      retry(2), // Reintentar 2 veces
      tap(response => {




      }),
      catchError(error => {
        console.error('❌ [ALUMNO-SERVICE] Error al obtener turnos:', error);
        console.error('❌ [ALUMNO-SERVICE] Status del error:', error?.status);
        console.error('❌ [ALUMNO-SERVICE] Mensaje del error:', error?.message);
        console.error('❌ [ALUMNO-SERVICE] Error completo:', error);
        
        // Si es error de conectividad, devolver array vacío en lugar de fallar
        if (error.status === 0) {
          console.warn('⚠️ [ALUMNO-SERVICE] Error de conectividad, devolviendo array vacío');
          return [];
        }
        
        console.error('❌ [ALUMNO-SERVICE] Error no es de conectividad, propagando error');
        throw error;
      })
    );
  }

  // Método modificado para evitar que la respuesta actualice el UserStore
  registrarAlumno(data: any): Observable<any> {
    const token = this.tokenService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    


    
    return this.http.post<any>(`${this.apiUrl}/alumnos/registrar`, data, { headers }).pipe(
      tap(response => {

      }),
      catchError(error => {
        console.error('❌ [ALUMNO-SERVICE] Error al registrar alumno:', error);
        throw error;
      })
    );
  }

  obtenerTodos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(this.apiUrl);
  }

  actualizar(id: string, data: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.apiUrl}/alumno${id}`, data);
  }

  getByCodigo(codigo: string): Observable<AlumnoSearchResponse> {
    return this.http
      .get<AlumnoSearchResponse>(`${this.apiUrl}/alumnos/codigo/${codigo}`);
  }

  actualizarAlumno(alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(
      `${this.apiUrl}alumnos/${alumno.id_alumno}`,
      alumno
    );
  }
}