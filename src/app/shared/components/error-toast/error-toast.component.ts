import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ErrorHandlerService, ErrorInfo, ErrorType } from '../../services/error-handler.service';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-toast.component.html',
  styleUrls: ['./error-toast.component.css']
})
export class ErrorToastComponent implements OnInit, OnDestroy {
  private errorHandlerService = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  errors: ErrorInfo[] = [];

  ngOnInit(): void {
    this.errorHandlerService.errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe(errors => {
        this.errors = errors;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Remover error específico
   */
  removeError(errorId: string): void {
    this.errorHandlerService.removeError(errorId);
    this.cdr.detectChanges();
  }

  /**
   * Limpiar todos los errores
   */
  clearAllErrors(): void {
    this.errorHandlerService.clearAllErrors();
    this.cdr.detectChanges();
  }

  /**
   * Obtener clase CSS para el tipo de error
   */
  getErrorClass(error: ErrorInfo): string {
    const baseClasses = 'relative flex items-start p-4 mb-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out';
    
    switch (error.type) {
      case ErrorType.NETWORK:
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case ErrorType.VALIDATION:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
      case ErrorType.AUTHENTICATION:
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case ErrorType.AUTHORIZATION:
        return `${baseClasses} bg-orange-50 border-orange-400 text-orange-800`;
      case ErrorType.NOT_FOUND:
        return `${baseClasses} bg-gray-50 border-gray-400 text-gray-800`;
      case ErrorType.SERVER:
        return `${baseClasses} bg-red-50 border-red-500 text-red-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400 text-gray-800`;
    }
  }

  /**
   * Obtener icono para el tipo de error
   */
  getErrorIcon(error: ErrorInfo): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Warning
      case ErrorType.VALIDATION:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info
      case ErrorType.AUTHENTICATION:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'; // Error
      case ErrorType.AUTHORIZATION:
        return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'; // Lock
      case ErrorType.NOT_FOUND:
        return 'M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'; // File
      case ErrorType.SERVER:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'; // Error
      default:
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Warning
    }
  }

  /**
   * Formatear timestamp
   */
  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByErrorId(index: number, error: ErrorInfo): string {
    return error.id;
  }

  /**
   * Obtener clase CSS para botones de acción
   */
  getActionButtonClass(type: 'primary' | 'secondary' | 'danger'): string {
    switch (type) {
      case 'primary':
        return 'action-primary';
      case 'secondary':
        return 'action-secondary';
      case 'danger':
        return 'action-danger';
      default:
        return 'action-secondary';
    }
  }
}
