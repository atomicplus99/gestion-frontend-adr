import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { EXCEL_MESSAGES } from '../constants/excel.constants';

@Injectable({
  providedIn: 'root'
})
export class ExcelNotificationService {

  success(message: string, title: string = 'Éxito'): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#3085d6'
    });
  }

  error(message: string, title: string = 'Error'): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#d33'
    });
  }

  warning(message: string, title: string = 'Advertencia'): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#f0ad4e'
    });
  }

  confirm(message: string, title: string = '¿Estás seguro?'): Promise<any> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });
  }

  // Métodos específicos para Excel
  importSuccess(total: number): Promise<any> {
    return this.success(
      `Se importaron ${total} alumnos correctamente.`,
      EXCEL_MESSAGES.SUCCESS.IMPORT
    );
  }

  importError(error?: string): Promise<any> {
    return this.error(
      error || EXCEL_MESSAGES.ERROR.IMPORT,
      'Error de Importación'
    );
  }

  exportSuccess(total: number): Promise<any> {
    return this.success(
      `Se exportaron ${total} registros correctamente.`,
      EXCEL_MESSAGES.SUCCESS.EXPORT
    );
  }

  validationError(): Promise<any> {
    return this.warning(
      EXCEL_MESSAGES.WARNING.NO_FILE + ' y ' + EXCEL_MESSAGES.WARNING.NO_TURNO,
      'Datos Incompletos'
    );
  }

  clearDataConfirm(): Promise<any> {
    return this.confirm(
      EXCEL_MESSAGES.WARNING.CLEAR_DATA,
      '¿Limpiar Datos?'
    );
  }
}
