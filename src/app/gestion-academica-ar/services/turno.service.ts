import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError, map } from 'rxjs';
import { Turno } from '../interfaces/turno.interface';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly API_URL = `${environment.apiUrl}/turno`;

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    // Crear headers personalizados para evitar el interceptor
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.get<any>(this.API_URL, { headers }).pipe(
      map(response => {
        // Manejar respuesta anidada del backend
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else {
          console.warn('⚠️ [TURNO-SERVICE] Respuesta inesperada del backend:', response);
          return [];
        }
      }),
      tap(turnos => {


      }),
      catchError(error => {
        console.error('❌ [TURNO-SERVICE] Error al obtener turnos:', error);
        throw error;
      })
    );
  }
}
