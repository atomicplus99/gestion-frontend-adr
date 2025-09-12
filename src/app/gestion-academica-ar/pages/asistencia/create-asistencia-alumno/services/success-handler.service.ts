import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { RegistroAsistenciaRequestManual } from '../models/CreateAsistenciaManual.model';

@Injectable({
  providedIn: 'root'
})
export class SuccessHandlerService {

  async mostrarRegistroExitoso(
    response: any,
    datosRegistro: RegistroAsistenciaRequestManual,
    nombreCompleto: string,
    codigo: string,
    nombreAuxiliar: string,
    esFechaHoy: (fecha: string) => boolean,
    getFechaHoy: () => string
  ): Promise<void> {
    const horaActual = new Date().toLocaleTimeString();
    const fechaRegistro = datosRegistro.fecha || getFechaHoy();
    const fechaTexto = esFechaHoy(fechaRegistro) ? 'hoy' : fechaRegistro;
    const idRegistro = response?.asistencia?.id_asistencia || 'N/A';
    
    await Swal.fire({
      icon: 'success',
      title: 'Registro Completado',
      html: `
        <div style="text-align: center; font-size: 16px; line-height: 1.8;">
          <p><strong>Estudiante:</strong> ${nombreCompleto}</p>
          <p><strong>Código:</strong> ${codigo}</p>
          <p><strong>Estado:</strong> <span style="color: #059669; font-weight: bold;">${datosRegistro.estado_asistencia}</span></p>
          <p><strong>Hora:</strong> ${datosRegistro.hora_de_llegada}</p>
        </div>
      `,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563eb',
      timer: 5000,
      timerProgressBar: true
    });
  }
}