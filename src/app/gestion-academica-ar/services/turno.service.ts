import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Turno } from '../interfaces/turno.interface';


@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly API_URL = 'http://localhost:3000/turno';

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.API_URL);
  }
}
