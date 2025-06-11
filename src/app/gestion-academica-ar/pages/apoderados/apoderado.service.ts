// services/apoderado.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Apoderado, CreateApoderadoDto, UpdateApoderadoDto } from './models/ApoderadoDtos';


@Injectable({
  providedIn: 'root'
})
export class ApoderadoService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/apoderados';

  // CRUD Básico
  getAll(): Observable<Apoderado[]> {
    return this.http.get<Apoderado[]>(this.baseUrl);
  }

  getById(id: string): Observable<Apoderado> {
    return this.http.get<Apoderado>(`${this.baseUrl}/${id}`);
  }

  getByDni(dni: string): Observable<Apoderado> {
    return this.http.get<Apoderado>(`${this.baseUrl}/dni/${dni}`);
  }

  create(apoderado: CreateApoderadoDto): Observable<Apoderado> {
    return this.http.post<Apoderado>(this.baseUrl, apoderado);
  }

  update(id: string, apoderado: UpdateApoderadoDto): Observable<Apoderado> {
    return this.http.put<Apoderado>(`${this.baseUrl}/${id}`, apoderado);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Búsqueda con query params
  searchByDni(dni: string): Observable<Apoderado> {
    return this.http.get<Apoderado>(`${this.baseUrl}?dni=${dni}`);
  }
}