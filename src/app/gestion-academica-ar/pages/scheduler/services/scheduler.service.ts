import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActualizarConfiguracion, ConfiguracionScheduler, ResultadoEjecucion, StatusScheduler } from '../interfaces/SchedulerAdmin.interface';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private readonly baseUrl = `${environment.apiUrl}/scheduler`;

  constructor(private http: HttpClient) {}

  // Obtener configuración actual
  getConfiguracion(): Observable<ConfiguracionScheduler> {
    return this.http.get<ConfiguracionScheduler>(`${this.baseUrl}/configuracion`);
  }

  // Actualizar configuración
  actualizarConfiguracion(config: ActualizarConfiguracion): Observable<{configuracion: ConfiguracionScheduler; mensaje: string}> {
    return this.http.put<{configuracion: ConfiguracionScheduler; mensaje: string}>(`${this.baseUrl}/configuracion`, config);
  }

  // Ejecutar manualmente - AJUSTE: acepta ambos tipos pero mapea internamente
  ejecutarManual(turno: 'mañana' | 'tarde' | 'manana'): Observable<ResultadoEjecucion> {
    // Mapeo para compatibilidad con el componente
    const turnoApi = turno === 'manana' ? 'mañana' : turno;
    return this.http.post<ResultadoEjecucion>(`${this.baseUrl}/ejecutar-manual`, { turno: turnoApi });
  }

  // Obtener status
  getStatus(): Observable<StatusScheduler> {
    return this.http.get<StatusScheduler>(`${this.baseUrl}/status`);
  }

  // Pausar turno
  pausarTurno(turno: 'mañana' | 'tarde'): Observable<{success: boolean; mensaje: string}> {
    return this.http.post<{success: boolean; mensaje: string}>(`${this.baseUrl}/pausar/${turno}`, {});
  }

  // Reanudar turno
  reanudarTurno(turno: 'mañana' | 'tarde'): Observable<{success: boolean; mensaje: string}> {
    return this.http.post<{success: boolean; mensaje: string}>(`${this.baseUrl}/reanudar/${turno}`, {});
  }

  // Validar hora
  validarHora(hora: string): Observable<{valido: boolean; error?: string}> {
    return this.http.get<{valido: boolean; error?: string}>(`${this.baseUrl}/validar-hora?hora=${hora}`);
  }

  // Probar horario específico
  probarHorario(hora: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/testing/probar-horario`, { hora });
  }

  // Health check
  healthCheck(): Observable<{status: string; mensaje?: string}> {
    return this.http.get<{status: string; mensaje?: string}>(`${this.baseUrl}/health`);
  }

  // Simular envío masivo
  simularEnvio(cantidad: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/simular-envio`, { cantidad });
  }

  // Obtener configuraciones predefinidas
  getConfiguracionesPredefinidas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/configuraciones-predefinidas`);
  }

  // Obtener información de jobs
  getJobsInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/info`);
  }

  // Obtener próximas ejecuciones
  getProximasEjecuciones(): Observable<any> {
    return this.http.get(`${this.baseUrl}/proximas-ejecuciones`);
  }
}