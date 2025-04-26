import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertsService {


  info(message: string, title: string = 'Información') {
    Swal.fire({
      icon: 'info',
      title,
      toast: true,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#2b2d31',
      color: '#fff',
      customClass: {
        popup: 'rounded-lg shadow-lg border border-[#3a3c40] text-sm',
      },
    });
  }

  error(message: string, title: string = 'Error') {
    Swal.fire({
      icon: 'error',
      title,
      toast: true,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: '#2b2d31',
      color: '#fff',
      customClass: {
        popup: 'rounded-lg shadow-lg border border-[#3a3c40] text-sm',
      },
    });
  }

  success(message: string, title: string = '¡Éxito!') {
    Swal.fire({
      icon: 'success',
      title,
      toast: true,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#2b2d31',
      color: '#fff',
      customClass: {
        popup: 'rounded-lg shadow-lg border border-[#3a3c40] text-sm',
      },
    });
  }

  confirm(message: string, title: string = '¿Estás seguro?'): Promise<boolean> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      background: '#2b2d31',
      color: '#fff',
      customClass: {
        popup: 'rounded-lg shadow-lg border border-[#3a3c40] text-sm',
      },
    }).then(result => result.isConfirmed);
  }
}
