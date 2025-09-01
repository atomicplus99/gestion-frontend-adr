/**
 * Interfaces para el sistema de notificaciones
 */

// ===== INTERFACES PRINCIPALES =====

/**
 * Notificación individual
 */
export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'SCHEDULER' | 'JUSTIFICACION' | 'SISTEMA';
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado: 'no_leida' | 'leida';
  fecha_creacion: string;
  fecha_lectura?: string;
  detalles?: any;
}

/**
 * Respuesta del backend para notificaciones
 */
export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Contador de notificaciones
 */
export interface ContadorNotificaciones {
  total_no_leidas: number;
  por_tipo: {
    SCHEDULER: number;
    JUSTIFICACION: number;
    SISTEMA: number;
  };
}

/**
 * Respuesta de marcar como leída
 */
export interface MarcarLeidaResponse {
  notificacion: {
    id: string;
    estado: 'leida';
    fecha_lectura: string;
  };
}

/**
 * Parámetros de consulta para notificaciones
 */
export interface NotificacionesQueryParams {
  page?: number;
  limit?: number;
  tipo?: 'SCHEDULER' | 'JUSTIFICACION' | 'SISTEMA';
  estado?: 'no_leida' | 'leida' | 'TODAS';
}

// ===== INTERFACES DE WEBSOCKET =====

/**
 * Evento de nueva notificación recibida por WebSocket
 */
export interface WebSocketNotificationEvent {
  notificacion: Notificacion;
  timestamp: string;
}

/**
 * Estado del gateway WebSocket
 */
export interface WebSocketGatewayStatus {
  clientes_conectados: number;
  gateway_initialized: boolean;
  timestamp: string;
}

/**
 * Respuesta de prueba de notificación
 */
export interface TestNotificationResponse {
  notificacion_id: string;
  broadcast_enviado: boolean;
}

// ===== INTERFACES DE BACKEND =====

/**
 * Respuesta estándar del backend para notificaciones
 */
export interface BackendNotificationResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ===== ENUMS =====

/**
 * Tipos de notificación
 */
export enum TipoNotificacion {
  SCHEDULER = 'SCHEDULER',
  JUSTIFICACION = 'JUSTIFICACION',
  SISTEMA = 'SISTEMA'
}

/**
 * Prioridades de notificación
 */
export enum PrioridadNotificacion {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA'
}

/**
 * Estados de notificación
 */
export enum EstadoNotificacion {
  NO_LEIDA = 'no_leida',
  LEIDA = 'leida'
}

// ===== INTERFACES DE UTILIDAD =====

/**
 * Configuración de notificaciones
 */
export interface ConfiguracionNotificaciones {
  autoMarcarLeidas: boolean;
  mostrarSoloNoLeidas: boolean;
  limitePorPagina: number;
  tiposFiltrados: TipoNotificacion[];
}

/**
 * Estadísticas de notificaciones
 */
export interface EstadisticasNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
  por_tipo: {
    [key in TipoNotificacion]: number;
  };
  por_prioridad: {
    [key in PrioridadNotificacion]: number;
  };
}
