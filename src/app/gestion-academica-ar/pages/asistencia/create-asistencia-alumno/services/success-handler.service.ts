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
        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
          <h4 style="color: #059669; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Confirmación del Registro</h4>
          <p><strong>Estudiante:</strong> ${nombreCompleto}</p>
          <p><strong>Código:</strong> ${codigo}</p>
          <p><strong>Hora de llegada:</strong> ${datosRegistro.hora_de_llegada}</p>
          ${datosRegistro.hora_salida ? `<p><strong>Hora de salida:</strong> ${datosRegistro.hora_salida}</p>` : ''}
          <p><strong>Estado:</strong> ${datosRegistro.estado_asistencia}</p>
          <p><strong>Fecha de registro:</strong> ${fechaTexto}</p>
          <p><strong>Procesado a las:</strong> ${horaActual}</p>
          <p><strong>Registrado por:</strong> ${nombreAuxiliar}</p>
          <p><strong>ID de registro:</strong> ${idRegistro}</p>
        </div>
      `,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563eb',
      timer: 8000,
      timerProgressBar: true
    });
  }
}