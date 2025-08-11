import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Apoderado, AssignStudentsRequest } from '../models/AsignarAlumnoApoderado.model';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApoderadoAsignService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    getAllApoderados(): Observable<Apoderado[]> {
        return this.http.get<Apoderado[]>(`${this.baseUrl}/apoderados`);
    }

    getApoderadoById(id: string): Observable<Apoderado> {
        return this.http.get<Apoderado>(`${this.baseUrl}/apoderados/${id}`);
    }

    assignStudentsToApoderado(apoderadoId: string, request: AssignStudentsRequest): Observable<Apoderado> {
        return this.http.post<Apoderado>(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`, request);
    }

    removeStudentsFromApoderado(apoderadoId: string, request: AssignStudentsRequest): Observable<Apoderado> {
        return this.http.delete<Apoderado>(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`, { body: request });
    }

    getApoderadoStudents(apoderadoId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`);
    }
    deleteApoderado(apoderadoId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/apoderados/${apoderadoId}`);
    }
}