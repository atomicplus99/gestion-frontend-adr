// interfaces/justificaciones.interface.ts - Interfaces para el módulo de justificaciones

// ========================================
// INTERFACES PRINCIPALES
// ========================================

export interface JustificacionesResponse {
  statusCode: number;
  message: string;
  data: JustificacionItem[];
  total: number;
  paginacion: PaginacionInfo;
}

export interface JustificacionItem {
  id_justificacion: string;
  tipo_justificacion: "MEDICA" | "FAMILIAR" | "ACADEMICA" | "PERSONAL" | "EMERGENCIA";
  motivo: string;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EN_REVISION";
  fecha_solicitud: string; // ISO date string
  fechas_de_justificacion: string[]; // Array de fechas en formato "DD-MM-YYYY"
  documentos_adjuntos?: string[];
  fecha_respuesta?: string | null; // ISO date string
  observaciones_solicitante?: string | null;
  alumno_solicitante: AlumnoInfo;
  responsable?: ResponsableInfo; // Opcional porque puede no estar presente
  asistencias_creadas?: number;
}

export interface AlumnoInfo {
  id_alumno: string;
  codigo: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: string;
  seccion: string;
  turno: TurnoInfo;
}

export interface TurnoInfo {
  id_turno: string;
  nombre_turno: string;
  hora_inicio: string; // formato "HH:MM:SS"
  hora_fin: string; // formato "HH:MM:SS"
}

export interface ResponsableInfo {
  tipo?: "auxiliar" | "administrador" | "director" | "desconocido";
  id?: string;
  nombre?: string;
  apellido?: string;
  correo_electronico?: string;
}

export interface PaginacionInfo {
  pagina_actual: number;
  total_paginas: number;
  elementos_por_pagina: number;
  total_elementos: number;
  tiene_siguiente: boolean;
  tiene_anterior: boolean;
}

// ========================================
// INTERFACES PARA FILTROS Y QUERY
// ========================================

export interface JustificacionesQueryParams {
  codigo_alumno?: string;
  estado?: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EN_REVISION";
  tipo_justificacion?: "MEDICA" | "FAMILIAR" | "ACADEMICA" | "PERSONAL" | "EMERGENCIA";
  fecha_desde?: string; // formato "YYYY-MM-DD"
  fecha_hasta?: string; // formato "YYYY-MM-DD"
  pagina?: number;
  elementos_por_pagina?: number;
}

// ========================================
// INTERFACES PARA FILTROS DEL COMPONENTE
// ========================================

export interface FiltrosJustificaciones {
  codigo_alumno: string;
  estado: string;
  tipo_justificacion: string;
  fecha_desde: string;
  fecha_hasta: string;
}

// ========================================
// ENUMS PARA OPCIONES DE FILTROS
// ========================================

export const ESTADOS_JUSTIFICACION = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'EN_REVISION', label: 'En Revisión' }
] as const;

export const TIPOS_JUSTIFICACION = [
  { value: '', label: 'Todos los tipos' },
  { value: 'MEDICA', label: 'Médica' },
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'ACADEMICA', label: 'Académica' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'EMERGENCIA', label: 'Emergencia' }
] as const;

// ========================================
// INTERFACES PARA ESTADÍSTICAS
// ========================================

export interface EstadisticasJustificaciones {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  en_revision: number;
}
