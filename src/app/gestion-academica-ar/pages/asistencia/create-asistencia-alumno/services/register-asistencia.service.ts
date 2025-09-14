// services/registro-asistencia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AlumnoInfoAsistenciaManual, AsistenciaExistenteManual, EstadoInfoManualAsistencia, RegistroAsistenciaRequestManual, RegistroAsistenciaResponseManual, VerificarAsistenciaResponse } from '../models/CreateAsistenciaManual.model';


@Injectable({
  providedIn: 'root'
})
export class RegistroAsistenciaServiceManual {
  private baseUrl = `${environment.apiUrl}/asistencia`
  
  // Estados compartidos
  private alumnoEncontradoSubject = new BehaviorSubject<AlumnoInfoAsistenciaManual | null>(null);
  private asistenciaExistenteSubject = new BehaviorSubject<AsistenciaExistenteManual | null>(null);
  private fechaSeleccionadaSubject = new BehaviorSubject<string>('');
  
  public alumnoEncontrado$ = this.alumnoEncontradoSubject.asObservable();
  public asistenciaExistente$ = this.asistenciaExistenteSubject.asObservable();
  public fechaSeleccionada$ = this.fechaSeleccionadaSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar la fecha después de que el servicio esté completamente construido
    this.initializeFecha();
  }

  private initializeFecha(): void {
    const fechaHoy = this.getFechaHoy();
    console.log('🗓️ [SERVICE] Inicializando fecha:', fechaHoy);
    this.fechaSeleccionadaSubject.next(fechaHoy);
  }

  // Método temporal para debug - forzar fecha específica
  setFechaDebug(fecha: string): void {
    console.log('🐛 [DEBUG] Forzando fecha:', fecha);
    this.fechaSeleccionadaSubject.next(fecha);
  }

  // Getters para valores actuales
  get alumnoActual(): AlumnoInfoAsistenciaManual | null {
    return this.alumnoEncontradoSubject.value;
  }

  get asistenciaActual(): AsistenciaExistenteManual | null {
    return this.asistenciaExistenteSubject.value;
  }

  get fechaActual(): string {
    return this.fechaSeleccionadaSubject.value;
  }

  // Métodos para actualizar estados
  setAlumnoEncontrado(alumno: AlumnoInfoAsistenciaManual | null): void {
    this.alumnoEncontradoSubject.next(alumno);
  }

  setAsistenciaExistente(asistencia: AsistenciaExistenteManual | null): void {
    this.asistenciaExistenteSubject.next(asistencia);
  }

  setFechaSeleccionada(fecha: string): void {
    this.fechaSeleccionadaSubject.next(fecha);
  }

  // API calls
  verificarAsistencia(codigo: string, fecha?: string): Observable<VerificarAsistenciaResponse> {
    const fechaVerificar = fecha || this.fechaActual;
    return this.http.get<any>(`${this.baseUrl}/verificar/${codigo}?fecha=${fechaVerificar}`).pipe(
      map(response => {
        // Si la respuesta tiene estructura {success, message, timestamp, data}
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        // Si la respuesta es directamente el objeto esperado
        return response;
      })
    );
  }

  registrarAsistencia(datos: RegistroAsistenciaRequestManual): Observable<RegistroAsistenciaResponseManual> {
    return this.http.post<any>(`${this.baseUrl}/manual`, datos).pipe(
      map(response => {
        // Si la respuesta tiene estructura {success, message, timestamp, data}
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        // Si la respuesta es directamente el objeto esperado
        return response;
      })
    );
  }

  // Métodos de utilidad para fechas con zona horaria de Perú
  private getFechaPeruana(): Date {
    // Obtener fecha y hora actual en zona horaria de Perú (UTC-5)
    const ahora = new Date();
    
    // Usar toLocaleString con zona horaria de Perú para obtener la fecha correcta
    const fechaPeruanaStr = ahora.toLocaleString("en-US", {timeZone: "America/Lima"});
    const fechaPeruana = new Date(fechaPeruanaStr);
    
    console.log('🌍 [SERVICE] Fecha Perú calculada:', {
      ahora: ahora.toString(),
      fechaPeruanaStr,
      fechaPeruana: fechaPeruana.toString(),
      fechaPeruanaISO: fechaPeruana.toISOString()
    });
    
    return fechaPeruana;
  }

  getFechaHoy(): string {
    // Método alternativo más simple para obtener fecha de hoy
    const ahora = new Date();
    
    // Obtener fecha en zona horaria de Perú usando toLocaleDateString
    const fechaPeruana = ahora.toLocaleDateString("en-CA", {timeZone: "America/Lima"});
    
    console.log('🗓️ [SERVICE] Fecha de hoy calculada (método simple):', {
      ahora: ahora.toString(),
      fechaPeruana,
      fechaPeruanaISO: ahora.toISOString()
    });
    
    // Formatear como YYYY-MM-DD
    return fechaPeruana;
  }

  esFechaHoy(fecha: string): boolean {
    const fechaHoyPeru = this.getFechaHoy();

    return fecha === fechaHoyPeru;
  }

  // Método para obtener fecha con días de diferencia (para fechas rápidas)
  getFechaConDias(dias: number): string {
    const ahora = new Date();
    
    // Crear una nueva fecha con los días agregados
    const fechaConDias = new Date(ahora);
    fechaConDias.setDate(ahora.getDate() + dias);
    
    // Obtener fecha en zona horaria de Perú usando toLocaleDateString
    const fechaPeruana = fechaConDias.toLocaleDateString("en-CA", {timeZone: "America/Lima"});
    
    console.log('📅 [SERVICE] Fecha con días calculada:', {
      dias,
      ahora: ahora.toString(),
      fechaConDias: fechaConDias.toString(),
      fechaPeruana
    });
    
    return fechaPeruana;
  }

  obtenerInfoEstado(estado: string): EstadoInfoManualAsistencia {
    switch (estado) {
      case 'PUNTUAL':
        return {
          texto: 'PUNTUAL ✅',
          accion: 'La asistencia está correctamente registrada.'
        };
      case 'TARDANZA':
        return {
          texto: 'TARDANZA ⚠️',
          accion: 'La asistencia está registrada con tardanza.'
        };
      case 'ANULADO':
        return {
          texto: 'ANULADO ❌',
          accion: 'Use la interfaz de actualización para corregir registros anulados.'
        };
      case 'JUSTIFICADO':
        return {
          texto: 'JUSTIFICADO 📝',
          accion: 'Use la interfaz de justificaciones para modificar.'
        };
      case 'AUSENTE':
        return {
          texto: 'AUSENTE ❌',
          accion: 'Use la interfaz correspondiente para modificar ausencias.'
        };
      default:
        return {
          texto: estado,
          accion: 'Use la interfaz correspondiente para modificar este registro.'
        };
    }
  }

  validarFecha(fecha: string): { valida: boolean; mensaje?: string } {
    // Crear fecha seleccionada (formato YYYY-MM-DD)
    const fechaSeleccionada = new Date(fecha + 'T00:00:00');
    
    // Obtener fecha actual en zona horaria de Perú
    const fechaPeruana = this.getFechaPeruana();
    const hoyPeru = new Date(fechaPeruana.getFullYear(), fechaPeruana.getMonth(), fechaPeruana.getDate());
    
    // Calcular fecha límite (30 días atrás desde hoy en Perú)
    const hace30Dias = new Date(hoyPeru);
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    




    
    if (fechaSeleccionada > hoyPeru) {
      return {
        valida: false,
        mensaje: 'No se pueden registrar asistencias para fechas futuras.'
      };
    }
    
    if (fechaSeleccionada < hace30Dias) {
      return {
        valida: false,
        mensaje: 'No se recomienda registrar asistencias de más de 30 días atrás.'
      };
    }
    

    return { valida: true };
  }

  convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  validarHoraTurno(hora: string, horaInicio: string, horaFin: string): boolean {
    const horaEnMinutos = this.convertirHoraAMinutos(hora);
    const inicioEnMinutos = this.convertirHoraAMinutos(horaInicio);
    const finEnMinutos = this.convertirHoraAMinutos(horaFin);
    
    return horaEnMinutos >= inicioEnMinutos && horaEnMinutos <= finEnMinutos;
  }

  // Método para limpiar todos los estados
  limpiarEstados(): void {
    this.setAlumnoEncontrado(null);
    this.setAsistenciaExistente(null);
  }

  // Método para resetear todo al estado inicial
  resetearTodo(): void {
    this.limpiarEstados();
    this.setFechaSeleccionada(this.getFechaHoy());
  }
}