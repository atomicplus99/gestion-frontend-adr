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
      title: '🎉 ¡Registro Completado!',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <h4 style="color: #059669; margin-bottom: 10px;">✅ Confirmación del Registro</h4>
          <p><strong>👤 Estudiante:</strong> ${nombreCompleto}</p>
          <p><strong>📝 Código:</strong> ${codigo}</p>
          <p><strong>🕐 Hora llegada:</strong> ${datosRegistro.hora_de_llegada}</p>
          ${datosRegistro.hora_salida ? `<p><strong>🕐 Hora salida:</strong> ${datosRegistro.hora_salida}</p>` : ''}
          <p><strong>📊 Estado:</strong> ${datosRegistro.estado_asistencia}</p>
          <p><strong>📅 Fecha registro:</strong> ${fechaTexto}</p>
          <p><strong>⏰ Procesado:</strong> ${horaActual}</p>
          <p><strong>👤 Auxiliar:</strong> ${nombreAuxiliar}</p>
          <p><strong>🆔 ID:</strong> ${idRegistro}</p>
        </div>
      `,
      confirmButtonText: 'Nuevo Registro',
      confirmButtonColor: '#2563eb',
      timer: 8000,
      timerProgressBar: true
    });
  }
}