import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Turno } from '../interfaces/turno.interface';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly API_URL = `${environment.apiUrl}/turno`;

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.API_URL);
  }
}
