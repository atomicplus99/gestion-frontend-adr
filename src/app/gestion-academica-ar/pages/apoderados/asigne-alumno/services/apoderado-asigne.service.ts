import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Apoderado, AssignStudentsRequest, SuccessAssignmentResponseDto } from '../models/AsignarAlumnoApoderado.model';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApoderadoAsignService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    getAllApoderados(): Observable<Apoderado[]> {
        return this.http.get<any>(`${this.baseUrl}/apoderados`).pipe(
            map(response => {
                // Si la respuesta tiene estructura {success, message, data}
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data && Array.isArray(response.data) ? response.data : [];
                }
                // Si la respuesta es directamente un array
                if (Array.isArray(response)) {
                    return response;
                }
                // Si no es ninguna de las anteriores, devolver array vacío
                return [];
            })
        );
    }

    getApoderadoById(id: string): Observable<Apoderado> {
        return this.http.get<any>(`${this.baseUrl}/apoderados/${id}`).pipe(
            map(response => {
                // Si la respuesta tiene estructura {success, message, data}
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data || null;
                }
                // Si la respuesta es directamente el objeto
                return response;
            })
        );
    }

    assignStudentsToApoderado(apoderadoId: string, request: AssignStudentsRequest): Observable<SuccessAssignmentResponseDto> {
        return this.http.post<SuccessAssignmentResponseDto>(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`, request);
    }

    removeStudentsFromApoderado(apoderadoId: string, request: AssignStudentsRequest): Observable<SuccessAssignmentResponseDto> {
        return this.http.delete<SuccessAssignmentResponseDto>(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`, { body: request });
    }

    getApoderadoStudents(apoderadoId: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/apoderados/${apoderadoId}/estudiantes`).pipe(
            map(response => {
                // Si la respuesta tiene estructura {success, message, data}
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data || [];
                }
                // Si la respuesta es directamente un array
                if (Array.isArray(response)) {
                    return response;
                }
                // Si no es ninguna de las anteriores, devolver array vacío
                return [];
            })
        );
    }
    deleteApoderado(apoderadoId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/apoderados/${apoderadoId}`);
    }
}