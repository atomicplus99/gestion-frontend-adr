import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
  BackendResponse, 
  ResultadoEjecucion, 
  EstadisticasAusencias,
  PayloadEjecucion,
  PayloadProgramacion,
  RespuestaProgramacion,
  AusenciaProgramada,
  TurnosDisponibles
} from '../interfaces/ausencias-masivas.interface';

@Injectable({
  providedIn: 'root'
})
export class AusenciasMasivasService {

  constructor(private http: HttpClient) { 
    console.log('🔧 AUSENCIAS MASIVAS SERVICE INICIALIZADO:');
    console.log('  - Environment API URL:', environment.apiUrl);
    console.log('  - URL completa para programar:', `${environment.apiUrl}/asistencia/ausencias-masivas/programar`);
    console.log('  - HttpClient disponible:', !!this.http);
  }

  /**
   * Programa ausencias automáticas para una fecha y hora futura
   * @param fecha Fecha requerida en formato YYYY-MM-DD
   * @param hora Hora requerida en formato HH:MM:SS
   * @param turnos String de turno opcional: 'MAÑANA', 'TARDE', 'AMBOS'
   * @returns Observable con la respuesta de programación
   */
  programarAusencias(fecha: string, hora: string, turnos: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<RespuestaProgramacion> {
    console.log('🌐 ENVIANDO PETICIÓN AL BACKEND:');
    console.log('  - URL:', `${environment.apiUrl}/asistencia/ausencias-masivas/programar`);
    console.log('  - Payload:', { fecha, hora, turnos });
    console.log('  - Tipo de fecha:', typeof fecha);
    console.log('  - Fecha como Date:', new Date(fecha));
    
    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/programar`;
    
    const payload: PayloadProgramacion = {
      fecha,
      hora,
      turnos
    };

    console.log('📤 PAYLOAD FINAL A ENVIAR:');
    console.log('  - Objeto payload:', payload);
    console.log('  - JSON.stringify:', JSON.stringify(payload));
    console.log('  - Tipo de payload:', typeof payload);
    console.log('  - Fecha en payload:', payload.fecha);
    console.log('  - Hora en payload:', payload.hora);
    console.log('  - Turnos en payload:', payload.turnos);
    console.log('  - Tipo de turnos:', typeof payload.turnos);
    console.log('  - Turno seleccionado:', payload.turnos);
    
    console.log('🔗 DETALLES DE LA PETICIÓN HTTP:');
    console.log('  - Método: POST');
    console.log('  - URL completa:', url);
    console.log('  - Content-Type: application/json (automático)');
    
    console.log('📡 ENVIANDO PETICIÓN HTTP...');
    
    return this.http.post<BackendResponse<RespuestaProgramacion>>(url, payload)
      .pipe(
        map(response => {
          console.log('📥 RESPUESTA DEL BACKEND RECIBIDA:');
          console.log('  - Respuesta completa:', response);
          console.log('  - Tipo de respuesta:', typeof response);
          console.log('  - Success:', response.success);
          console.log('  - Message:', response.message);
          console.log('  - Data:', response.data);
          console.log('  - Timestamp:', response.timestamp);
          console.log('  - Data extraída:', response.data);
          
          if (response.data) {
            console.log('✅ DATOS DE PROGRAMACIÓN:');
            console.log('  - ID de programación:', response.data.idProgramacion);
            console.log('  - Fecha programada:', response.data.fecha);
            console.log('  - Hora programada:', response.data.hora);
            console.log('  - Turnos programados:', response.data.turnos);
            console.log('  - Mensaje del backend:', response.data.mensaje);
          }
          
          return response.data;
        })
      );
  }

  /**
   * Ejecuta el programa de ausencias masivas (mantenido para compatibilidad)
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   * @param hora Hora opcional en formato HH:MM:SS
   * @param turnos Turno opcional: MAÑANA | TARDE | AMBOS (por defecto AMBOS)
   * @returns Observable con el resultado de la ejecución
   */
  ejecutarPrograma(fecha?: string, hora?: string, turnos?: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<ResultadoEjecucion> {
    const url = `${environment.apiUrl}/asistencia/ausencias-masivas/ejecutar`;
    
    // Construir el payload del body
    const payload: PayloadEjecucion = {};
    
    if (fecha) {
      payload.fecha = fecha;
    }
    
    if (hora) {
      payload.hora = hora;
    }
    
    if (turnos && turnos !== TurnosDisponibles.AMBOS) {
      payload.turnos = turnos;
    }

    return this.http.post<BackendResponse<ResultadoEjecucion>>(url, payload)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtiene estadísticas detalladas del estado de asistencias
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   * @param turnos Turno opcional: MAÑANA | TARDE | AMBOS (por defecto AMBOS)
   * @returns Observable con las estadísticas
   */
  obtenerEstadisticas(fecha?: string, turnos?: 'MAÑANA' | 'TARDE' | 'AMBOS'): Observable<EstadisticasAusencias> {
    let url = `${environment.apiUrl}/asistencia/ausencias-masivas/estadisticas`;
    
    const params: string[] = [];
    
    if (fecha) {
      params.push(`fecha=${fecha}`);
    }
    
    if (turnos && turnos !== TurnosDisponibles.AMBOS) {
      params.push(`turnos=${turnos}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<BackendResponse<EstadisticasAusencias>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtiene las ausencias programadas
   * @returns Observable con las ausencias programadas
   */
  obtenerAusenciasProgramadas(): Observable<AusenciaProgramada[]> {
    console.log('🌐 SOLICITANDO AUSENCIAS PROGRAMADAS...');
    console.log('  - URL:', `${environment.apiUrl}/asistencia/ausencias-masivas/programadas`);
    
    return this.http.get<BackendResponse<AusenciaProgramada[]>>(`${environment.apiUrl}/asistencia/ausencias-masivas/programadas`)
      .pipe(
        map(response => {
          console.log('📥 RESPUESTA AUSENCIAS PROGRAMADAS:', response);
          console.log('  - Success:', response.success);
          console.log('  - Message:', response.message);
          console.log('  - Data:', response.data);
          console.log('  - Tipo de data:', typeof response.data);
          console.log('  - Es array:', Array.isArray(response.data));
          
          if (response.data && Array.isArray(response.data)) {
            console.log('📋 AUSENCIAS ENCONTRADAS:', response.data.length);
            response.data.forEach((ausencia, index) => {
              console.log(`  - Ausencia ${index + 1}:`, {
                id: ausencia.id,
                fecha: ausencia.fecha,
                tipoFecha: typeof ausencia.fecha,
                formatoFecha: this.detectarFormatoFecha(ausencia.fecha),
                hora: ausencia.hora,
                turnos: ausencia.turnos,
                estado: ausencia.estado
              });
            });
          }
          
          return response.data || [];
        })
      );
  }

  /**
   * Obtiene el historial de ejecuciones del programa
   * @returns Observable con el historial
   */
  obtenerHistorial(): Observable<any[]> {
    console.log('🌐 SOLICITANDO HISTORIAL DE EJECUCIONES...');
    console.log('  - URL:', `${environment.apiUrl}/asistencia/ausencias-masivas/historial`);
    
    return this.http.get<BackendResponse<any[]>>(`${environment.apiUrl}/asistencia/ausencias-masivas/historial`)
      .pipe(
        map(response => {
          console.log('📥 RESPUESTA HISTORIAL:', response);
          console.log('  - Success:', response.success);
          console.log('  - Message:', response.message);
          console.log('  - Data:', response.data);
          console.log('  - Tipo de data:', typeof response.data);
          console.log('  - Es array:', Array.isArray(response.data));
          
          if (response.data && Array.isArray(response.data)) {
            console.log('📋 EJECUCIONES ENCONTRADAS:', response.data.length);
            response.data.forEach((ejecucion, index) => {
              console.log(`  - Ejecución ${index + 1}:`, {
                id: ejecucion.id,
                fecha: ejecucion.fecha,
                tipoFecha: typeof ejecucion.fecha,
                formatoFecha: this.detectarFormatoFecha(ejecucion.fecha),
                horaEjecucion: ejecucion.horaEjecucion,
                totalAlumnos: ejecucion.totalAlumnos,
                ausenciasCreadas: ejecucion.ausenciasCreadas,
                estado: ejecucion.estado
              });
            });
          }
          
          return response.data || [];
        })
      );
  }

  /**
   * Valida si una fecha es válida para ejecutar el programa (no futuras)
   * @param fecha Fecha a validar
   * @returns true si la fecha es válida
   */
  validarFecha(fecha: string): boolean {
    // Crear fechas solo con día, mes y año (sin hora)
    const fechaObj = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    // No permitir fechas futuras (comparando solo fecha, no hora)
    return fechaObj <= hoySoloFecha;
  }

  /**
   * Valida si una fecha es válida para programar (hoy o futuras)
   * @param fecha Fecha a validar
   * @returns true si la fecha es válida para programación
   */
  validarFechaProgramacion(fecha: string): boolean {
    console.log('🔍 VALIDANDO FECHA PARA PROGRAMACIÓN:');
    console.log('  - Fecha recibida:', fecha);
    console.log('  - Tipo de fecha recibida:', typeof fecha);
    
    // Crear fechas solo con día, mes y año (sin hora)
    const fechaObj = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    console.log('  - Fecha convertida a Date (solo fecha):', fechaObj);
    console.log('  - Fecha actual (solo fecha):', hoySoloFecha);
    console.log('  - Comparación fechaObj >= hoySoloFecha:', fechaObj >= hoySoloFecha);
    console.log('  - Diferencia en milisegundos:', fechaObj.getTime() - hoySoloFecha.getTime());
    console.log('  - Diferencia en días:', (fechaObj.getTime() - hoySoloFecha.getTime()) / (1000 * 60 * 60 * 24));
    
    // Permitir programar para hoy o fechas futuras (comparando solo fecha, no hora)
    const esValida = fechaObj >= hoySoloFecha;
    console.log('  - RESULTADO VALIDACIÓN:', esValida ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    console.log('  - Lógica: fecha >= hoy (permite hoy y futuras)');
    console.log('  - Fecha válida para programación:', esValida);
    
    return esValida;
  }

  /**
   * Formatea una fecha para mostrar en la interfaz
   * @param fecha Fecha a formatear (acepta múltiples formatos)
   * @returns Fecha formateada
   */
  formatearFecha(fecha: string): string {
    console.log('🔍 FORMATEANDO FECHA:', fecha);
    console.log('  - Tipo de fecha:', typeof fecha);
    console.log('  - Longitud:', fecha?.length);
    
    try {
      // Validar que la fecha tenga el formato correcto
      if (!fecha || typeof fecha !== 'string') {
        console.log('❌ Fecha vacía o no es string');
        return 'Fecha inválida';
      }
      
      let fechaObj: Date;
      
      // Intentar diferentes formatos de fecha
      if (fecha.includes('/')) {
        // Formato DD/MM/YYYY o MM/DD/YYYY
        console.log('📅 DETECTADO FORMATO CON BARRAS (/)');
        const partes = fecha.split('/');
        console.log('  - Partes separadas por /:', partes);
        
        if (partes.length === 3) {
          const [parte1, parte2, parte3] = partes.map(Number);
          console.log('  - Partes convertidas a números:', { parte1, parte2, parte3 });
          
          // Determinar si es DD/MM/YYYY o MM/DD/YYYY basándose en el año
          if (parte3 >= 1000) {
            // Formato DD/MM/YYYY
            console.log('  - Formato detectado: DD/MM/YYYY');
            fechaObj = new Date(parte3, parte2 - 1, parte1);
          } else if (parte1 >= 1000) {
            // Formato MM/DD/YYYY
            console.log('  - Formato detectado: MM/DD/YYYY');
            fechaObj = new Date(parte1, parte2 - 1, parte3);
          } else {
            // Asumir DD/MM/YYYY por defecto
            console.log('  - Formato asumido: DD/MM/YYYY');
            fechaObj = new Date(parte3, parte2 - 1, parte1);
          }
        } else {
          console.log('❌ Formato con barras inválido - no tiene 3 partes');
          return 'Fecha inválida';
        }
      } else if (fecha.includes('-')) {
        // Formato YYYY-MM-DD
        console.log('📅 DETECTADO FORMATO CON GUIONES (-)');
        const [año, mes, dia] = fecha.split('-').map(Number);
        console.log('  - Componentes extraídos:', { año, mes, dia });
        
        if (isNaN(año) || isNaN(mes) || isNaN(dia)) {
          console.log('❌ Componentes no son números válidos');
          return 'Fecha inválida';
        }
        
        fechaObj = new Date(año, mes - 1, dia);
      } else {
        console.log('❌ Formato de fecha no reconocido');
        return 'Fecha inválida';
      }
      
      console.log('  - Objeto Date creado:', fechaObj);
      console.log('  - Timestamp válido:', !isNaN(fechaObj.getTime()));
      
      // Validar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.log('❌ Objeto Date inválido');
        return 'Fecha inválida';
      }
      
      // Formatear usando toLocaleDateString
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      console.log('✅ Fecha formateada exitosamente:', fechaFormateada);
      return fechaFormateada;
    } catch (error) {
      console.error('❌ Error formateando fecha:', fecha, error);
      return 'Error de formato';
    }
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns Fecha actual formateada
   */
  obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  /**
   * Detecta el formato de una fecha
   * @param fecha Fecha a analizar
   * @returns Descripción del formato detectado
   */
  private detectarFormatoFecha(fecha: string): string {
    if (!fecha || typeof fecha !== 'string') {
      return 'Fecha vacía o no es string';
    }
    
    if (fecha.includes('/')) {
      const partes = fecha.split('/');
      if (partes.length === 3) {
        const [parte1, parte2, parte3] = partes.map(Number);
        if (parte3 >= 1000) {
          return 'DD/MM/YYYY';
        } else if (parte1 >= 1000) {
          return 'MM/DD/YYYY';
        } else {
          return 'DD/MM/YYYY (asumido)';
        }
      }
      return 'Formato con barras inválido';
    } else if (fecha.includes('-')) {
      return 'YYYY-MM-DD';
    } else {
      return 'Formato no reconocido';
    }
  }
}
