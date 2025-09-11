// ====================================
// ARCHIVO: src/app/modules/excel/services/excel-import.service.ts
// ====================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TurnoModuleExcel } from '../models/turno-excel.model';
import { EXCEL_CONFIG, EXCEL_MESSAGES } from '../constants/excel.constants';
import { ExcelImportRequest, ExcelImportResponse, ExcelWidgetData } from '../models/excel-import.model';
import { ExcelApiResponse } from '../models/responses/excel-api-response.model';
import { AlumnoModuleExcel } from '../models/alumno-excel.model';
import { ExcelUtils } from '../utils/excel.utils';




@Injectable({
    providedIn: 'root'
})
export class ExcelImportService {

    private readonly apiUrl = EXCEL_CONFIG.API.BASE_URL + EXCEL_CONFIG.API.ENDPOINTS.ALUMNOS;
    private readonly turnosUrl = EXCEL_CONFIG.API.BASE_URL + EXCEL_CONFIG.API.ENDPOINTS.TURNOS;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de turnos disponibles
     */
    obtenerTurnos(): Observable<TurnoModuleExcel[]> {
        return this.http.get<any>(this.turnosUrl).pipe(
            map(response => {
                // Manejar respuesta estructurada del backend
                if (response && response.success && response.data) {
                    return response.data;
                }
                // Fallback para respuesta directa (sin estructura)
                return response || [];
            }),
            catchError(error => {
                console.error('Error al cargar turnos:', error);
                return throwError(() => new Error(EXCEL_MESSAGES.ERROR.NETWORK));
            })
        );
    }

    /**
     * Importa alumnos desde un archivo Excel
     */
    importarAlumnos(request: ExcelImportRequest): Observable<ExcelImportResponse> {
        const formData = new FormData();
        formData.append('file', request.file);

        const url = `${this.apiUrl}/register-alumno-for-excel?turnoId=${request.turno_id}`;

        return this.http.post<ExcelApiResponse>(url, formData).pipe(
            map(response => {
                return {
                    success: true,
                    message: response.message || EXCEL_MESSAGES.SUCCESS.IMPORT,
                    total: response.total || response.data?.length || 0,
                    alumnos: response.data || []
                } as ExcelImportResponse;
            }),
            catchError((error: HttpErrorResponse) => {
                return this.manejarErrorImportacion(error);
            })
        );
    }

    /**
     * Calcula estadísticas de la importación
     */
    calcularEstadisticas(alumnos: AlumnoModuleExcel[], tiempoProceso: number): ExcelWidgetData {
        const usuariosCreados = alumnos.filter(a => a.usuario).length;
        const porcentajeUsuarios = alumnos.length > 0 ?
            Math.round((usuariosCreados / alumnos.length) * 100) : 0;
        const registrosConError = alumnos.filter(a =>
            ExcelUtils.validarDatosAlumno(a).length > 0
        ).length;

        return {
            importadosHoy: alumnos.length,
            registrosConError,
            usuariosCreados,
            porcentajeUsuariosCreados: porcentajeUsuarios,
            tiempoProceso
        };
    }

    /**
     * Exporta alumnos a Excel (implementación básica)
     */
    exportarAlumnos(alumnos: AlumnoModuleExcel[]): void {
        if (alumnos.length === 0) return;

        const data = alumnos.map(a => ({
            'Código': a.codigo,
            'DNI': a.dni_alumno,
            'Nombre': a.nombre,
            'Apellido': a.apellido,
            'Nivel': a.nivel,
            'Grado': a.grado,
            'Sección': a.seccion,
            'Fecha Nacimiento': ExcelUtils.formatearFecha(a.fecha_nacimiento),
            'Turno': a.turno.turno,
            'Usuario': a.usuario?.nombre_usuario || 'N/A',
            'Contraseña': a.usuario?.password_user || 'N/A'
        }));

        // Aquí iría la implementación real con XLSX


        // Simulación de descarga
        const fecha = ExcelUtils.formatearFecha(new Date(), 'yyyy-MM-dd');

    }

    // ====================================
    // MÉTODOS PRIVADOS
    // ====================================

    /**
     * Maneja errores de importación sin generar datos ficticios
     */
    private manejarErrorImportacion(error: HttpErrorResponse): Observable<never> {
        console.error('Error en importación:', error);

        let mensajeError: string = EXCEL_MESSAGES.ERROR.IMPORT;

        // Personalizar mensaje según el tipo de error
        if (error.status === 0) {
            mensajeError = EXCEL_MESSAGES.ERROR.NETWORK;
        } else if (error.status === 400) {
            mensajeError = EXCEL_MESSAGES.ERROR.VALIDATION;
        } else if (error.status === 413) {
            mensajeError = EXCEL_MESSAGES.ERROR.FILE_SIZE;
        } else if (error.status === 415) {
            mensajeError = EXCEL_MESSAGES.ERROR.FILE_FORMAT;
        }

        return throwError(() => new Error(mensajeError));
    }
}
