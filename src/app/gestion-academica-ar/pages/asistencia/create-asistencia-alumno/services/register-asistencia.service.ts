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
  private fechaSeleccionadaSubject = new BehaviorSubject<string>(this.getFechaHoy());
  
  public alumnoEncontrado$ = this.alumnoEncontradoSubject.asObservable();
  public asistenciaExistente$ = this.asistenciaExistenteSubject.asObservable();
  public fechaSeleccionada$ = this.fechaSeleccionadaSubject.asObservable();

  constructor(private http: HttpClient) {}

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
    const offsetPeru = -5; // UTC-5 (Perú)
    const offsetLocal = ahora.getTimezoneOffset() / 60; // Offset local en horas
    const diferenciaHoras = offsetPeru - (-offsetLocal); // Diferencia entre Perú y local
    
    // Crear nueva fecha ajustada a zona horaria de Perú
    const fechaPeruana = new Date(ahora.getTime() + (diferenciaHoras * 60 * 60 * 1000));
    return fechaPeruana;
  }

  getFechaHoy(): string {
    // Obtener fecha actual en zona horaria de Perú (UTC-5)
    const fechaPeruana = this.getFechaPeruana();
    
    // Obtener componentes de fecha en zona horaria de Perú
    const año = fechaPeruana.getFullYear();
    const mes = String(fechaPeruana.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaPeruana.getDate()).padStart(2, '0');
    



    
    // Formatear como YYYY-MM-DD
    return `${año}-${mes}-${dia}`;
  }

  esFechaHoy(fecha: string): boolean {
    const fechaHoyPeru = this.getFechaHoy();

    return fecha === fechaHoyPeru;
  }

  // Método para obtener fecha con días de diferencia (para fechas rápidas)
  getFechaConDias(dias: number): string {
    const fechaPeruana = this.getFechaPeruana();
    fechaPeruana.setDate(fechaPeruana.getDate() + dias);
    
    const año = fechaPeruana.getFullYear();
    const mes = String(fechaPeruana.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaPeruana.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
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