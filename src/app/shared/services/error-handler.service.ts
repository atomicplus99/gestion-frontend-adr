import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

export interface ErrorInfo {
  id: string;
  type: ErrorType;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  action?: ErrorAction;
  retryable: boolean;
  autoHide: boolean;
  duration?: number;
}

export interface ErrorAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<ErrorInfo[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  private maxErrors = 5; // Máximo número de errores a mostrar simultáneamente

  /**
   * Agregar un nuevo error
   */
  addError(error: Partial<ErrorInfo>): string {
    const errorId = this.generateErrorId();
    const fullError: ErrorInfo = {
      id: errorId,
      type: error.type || ErrorType.UNKNOWN,
      title: error.title || 'Error',
      message: error.message || 'Ha ocurrido un error inesperado',
      details: error.details,
      timestamp: new Date(),
      action: error.action,
      retryable: error.retryable || false,
      autoHide: error.autoHide !== false,
      duration: error.duration || 5000
    };

    const currentErrors = this.errorsSubject.value;
    const newErrors = [fullError, ...currentErrors].slice(0, this.maxErrors);
    this.errorsSubject.next(newErrors);
    
    // Forzar detección de cambios
    setTimeout(() => {
      this.errorsSubject.next([...newErrors]);
    }, 0);

    // Auto-hide si está configurado
    if (fullError.autoHide && fullError.duration) {
      setTimeout(() => {
        this.removeError(errorId);
      }, fullError.duration);
    }

    return errorId;
  }

  /**
   * Remover un error específico
   */
  removeError(errorId: string): void {
    const currentErrors = this.errorsSubject.value;
    const filteredErrors = currentErrors.filter(error => error.id !== errorId);
    this.errorsSubject.next(filteredErrors);
    
    // Forzar detección de cambios
    setTimeout(() => {
      this.errorsSubject.next([...filteredErrors]);
    }, 0);
  }

  /**
   * Limpiar todos los errores
   */
  clearAllErrors(): void {
    this.errorsSubject.next([]);
    
    // Forzar detección de cambios
    setTimeout(() => {
      this.errorsSubject.next([]);
    }, 0);
  }

  /**
   * Manejar errores HTTP
   */
  handleHttpError(error: any, context?: string): string {
    let errorInfo: Partial<ErrorInfo> = {};

    if (error.status === 0) {
      // Error de red
      errorInfo = {
        type: ErrorType.NETWORK,
        title: 'Error de Conexión',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        retryable: true,
        action: {
          label: 'Reintentar',
          action: () => {
            // La acción de reintento debe ser manejada por el componente
          },
          type: 'primary'
        }
      };
    } else if (error.status === 401) {
      // No autorizado
      errorInfo = {
        type: ErrorType.AUTHENTICATION,
        title: 'Sesión Expirada',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        retryable: false,
        autoHide: false
      };
    } else if (error.status === 403) {
      // Sin permisos
      errorInfo = {
        type: ErrorType.AUTHORIZATION,
        title: 'Sin Permisos',
        message: 'No tienes permisos para realizar esta acción.',
        retryable: false
      };
    } else if (error.status === 404) {
      // No encontrado
      errorInfo = {
        type: ErrorType.NOT_FOUND,
        title: 'No Encontrado',
        message: 'El recurso solicitado no fue encontrado.',
        retryable: false
      };
    } else if (error.status >= 500) {
      // Error del servidor
      errorInfo = {
        type: ErrorType.SERVER,
        title: 'Error del Servidor',
        message: 'El servidor está experimentando problemas. Intenta más tarde.',
        retryable: true,
        action: {
          label: 'Reintentar',
          action: () => {},
          type: 'primary'
        }
      };
    } else if (error.status === 400) {
      // Error de validación
      errorInfo = {
        type: ErrorType.VALIDATION,
        title: 'Error de Validación',
        message: error.error?.message || 'Los datos proporcionados no son válidos.',
        details: error.error?.details,
        retryable: false
      };
    } else {
      // Error desconocido
      errorInfo = {
        type: ErrorType.UNKNOWN,
        title: 'Error Inesperado',
        message: error.error?.message || error.message || 'Ha ocurrido un error inesperado.',
        retryable: true
      };
    }

    // Agregar contexto si se proporciona
    if (context) {
      errorInfo.title = `${errorInfo.title} - ${context}`;
    }

    return this.addError(errorInfo);
  }

  /**
   * Manejar errores de validación de formularios
   */
  handleValidationError(fieldName: string, error: any): string {
    const errorMessages: { [key: string]: string } = {
      required: `${fieldName} es requerido`,
      email: `${fieldName} debe ser un email válido`,
      minlength: `${fieldName} debe tener al menos ${error.requiredLength} caracteres`,
      maxlength: `${fieldName} no puede tener más de ${error.requiredLength} caracteres`,
      pattern: `${fieldName} no tiene el formato correcto`
    };

    const message = errorMessages[error.key] || `${fieldName} no es válido`;

    return this.addError({
      type: ErrorType.VALIDATION,
      title: 'Error de Validación',
      message: message,
      retryable: false,
      autoHide: true,
      duration: 3000
    });
  }

  /**
   * Generar ID único para el error
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener errores actuales
   */
  getCurrentErrors(): ErrorInfo[] {
    return this.errorsSubject.value;
  }

  /**
   * Verificar si hay errores activos
   */
  hasErrors(): boolean {
    return this.errorsSubject.value.length > 0;
  }

  /**
   * Obtener errores por tipo
   */
  getErrorsByType(type: ErrorType): ErrorInfo[] {
    return this.errorsSubject.value.filter(error => error.type === type);
  }
}
