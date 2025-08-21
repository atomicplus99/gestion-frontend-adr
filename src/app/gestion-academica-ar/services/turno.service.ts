import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { Turno } from '../interfaces/turno.interface';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly API_URL = `${environment.apiUrl}/turno`;

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    console.log('🔄 [TURNO-SERVICE] Iniciando petición GET a /turno...');
    console.log('🔄 [TURNO-SERVICE] URL completa:', this.API_URL);
    console.log('🔄 [TURNO-SERVICE] Environment API URL:', environment.apiUrl);
    
    // Crear headers personalizados para evitar el interceptor
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('🔄 [TURNO-SERVICE] Headers creados:', headers);
    console.log('🔄 [TURNO-SERVICE] Usando HttpClient...');
    
    return this.http.get<Turno[]>(this.API_URL, { headers }).pipe(
      tap(response => {
        console.log('✅ [TURNO-SERVICE] Respuesta exitosa:', response);
      }),
      catchError(error => {
        console.error('❌ [TURNO-SERVICE] Error al obtener turnos:', error);
        console.error('❌ [TURNO-SERVICE] Status:', error?.status);
        console.error('❌ [TURNO-SERVICE] StatusText:', error?.statusText);
        console.error('❌ [TURNO-SERVICE] URL:', error?.url);
        console.error('❌ [TURNO-SERVICE] Error completo:', error);
        throw error;
      })
    );
  }
}
