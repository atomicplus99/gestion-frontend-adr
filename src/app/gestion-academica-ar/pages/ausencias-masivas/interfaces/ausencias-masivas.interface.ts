/**
 * Interfaces para el módulo de Ausencias Masivas
 * Define las estructuras de datos para la programación automática de ausencias
 */

// ===== INTERFACES PRINCIPALES =====

/**
 * Resultado de la ejecución del programa de ausencias
 */
export interface ResultadoEjecucion {
  totalAlumnos: number;
  ausenciasCreadas: number;
  alumnosConAsistencia: number;
  fechaProcesada: string;
  horaEjecucion: string;
  turnosProcesados: string[];
}

/**
 * Estadísticas de asistencias para una fecha específica
 */
export interface EstadisticasAusencias {
  fecha: string;
  totalAlumnos: number;
  ausenciasRegistradas: number;
  asistenciasRegistradas: number;
  alumnosSinAsistencia: number;
  porcentajeCobertura: number;
}

/**
 * Ejecución de ausencias masivas
 */
export interface EjecucionAusenciasMasivas {
  id: string;
  fecha: string;
  horaEjecucion: string;
  totalAlumnos: number;
  ausenciasCreadas: number;
  duracion: string;
  estado: 'PROGRAMADA' | 'COMPLETADO' | 'EN_PROCESO' | 'ERROR';
}

// ===== INTERFACES DE PROGRAMACIÓN =====

/**
 * Respuesta del backend para programación de ausencias
 */
export interface RespuestaProgramacion {
  idProgramacion: string;
  fecha: string;
  hora: string;
  turnos: string;
  mensaje: string;
  estado: 'PROGRAMADA' | 'COMPLETADO' | 'EN_PROCESO' | 'ERROR';
}

/**
 * Ausencia programada
 */
export interface AusenciaProgramada {
  id: string;
  fecha: string;
  hora: string;
  turnos: string;
  estado: 'PROGRAMADA' | 'COMPLETADO' | 'EN_PROCESO' | 'ERROR';
}

/**
 * Historial de ejecuciones
 */
export interface HistorialEjecucion {
  id: string;
  fecha: string;
  horaEjecucion: string;
  totalAlumnos: number;
  ausenciasCreadas: number;
  duracion: string;
  estado: 'PROGRAMADA' | 'COMPLETADO' | 'EN_PROCESO' | 'ERROR';
}

// ===== INTERFACES DE BACKEND =====

/**
 * Respuesta estándar del backend
 */
export interface BackendResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

/**
 * Payload para ejecutar programa de ausencias
 */
export interface PayloadEjecucion {
  fecha?: string;
  hora?: string;
  turnos?: string;
}

/**
 * Payload para programar ausencias
 */
export interface PayloadProgramacion {
  fecha: string;
  hora: string;
  turnos: string;
}

// ===== ENUMS Y CONSTANTES =====

/**
 * Turnos disponibles para programación
 */
export enum TurnosDisponibles {
  MAÑANA = 'MAÑANA',
  TARDE = 'TARDE',
  AMBOS = 'AMBOS'
}

/**
 * Estados de ejecución
 */
export enum EstadoEjecucion {
  PROGRAMADA = 'PROGRAMADA',
  COMPLETADO = 'COMPLETADO',
  EN_PROCESO = 'EN_PROCESO',
  ERROR = 'ERROR'
}

// ===== INTERFACES DE UTILIDAD =====

/**
 * Opción de turno para select
 */
export interface OpcionTurno {
  value: string;
  label: string;
}

/**
 * Configuración de programación
 */
export interface ConfiguracionProgramacion {
  fecha: string;
  hora: string;
  turnos: TurnosDisponibles;
  validarFecha: boolean;
  validarHora: boolean;
}
